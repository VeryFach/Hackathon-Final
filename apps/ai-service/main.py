"""
main.py
-------
SAF AI Service — FastAPI application.

Changes from the CSV-based version:
  1. All data is now loaded from PostgreSQL (via db_queries.py) instead of CSV files.
  2. A /webhook/new-data endpoint lets the backend trigger re-analysis automatically
     whenever a new OilSubmission or Payout is created.
  3. The last analysis result is cached in-process so the frontend can always
     GET /analyze and receive data instantly, even between trigger events.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
import os
from datetime import datetime
from typing import Optional

import pandas as pd
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from ai.clustering import (
    find_optimal_clusters,
    get_cluster_points,
    get_recommendations,
    perform_clustering,
)
from db.database import ping
from db.db_queries import (
    load_batch_value_history_from_db,
    load_collectors_from_db,
    load_depositors_from_db,
    load_purchase_history_from_db,
    load_submission_volumes_from_db,
)
from ai.prediction import forecast_fund
from models.schemas import (
    AIResponse,
    ClusterPoint,
    ClusterRequest,
    Coordinate,
    LocationRecommendation,
    PredictionData,
)

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="SAF AI Service", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-process cache — stores the last successful /analyze result
# ---------------------------------------------------------------------------

_analysis_cache: dict = {
    "result": None,          # AIResponse dict
    "computed_at": None,     # datetime
    "is_running": False,     # lock flag to avoid duplicate runs
}

# Optional shared secret for webhook signature verification.
# Set WEBHOOK_SECRET in .env to enable; leave blank to skip verification.
WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "")


# ---------------------------------------------------------------------------
# Core analysis logic (shared by /analyze and the background trigger)
# ---------------------------------------------------------------------------

def _run_analysis() -> AIResponse:
    """
    Full analysis pipeline:
      1. Load depositors from DB  →  cluster
      2. Load payout history from DB  →  forecast
      3. Return AIResponse
    """
    # --- depositors / clustering ---
    depositors = load_depositors_from_db()
    if not depositors:
        raise ValueError("No depositor data found in database.")

    coords = [{"latitude": d["latitude"], "longitude": d["longitude"]} for d in depositors]
    n_clusters = find_optimal_clusters(coords)
    logger.info("Using n_clusters = %d", n_clusters)

    cluster_result = perform_clustering(coords, n_clusters)
    depositors_df = pd.DataFrame(depositors)

    # Enrich volume from DB (actual litres per depositor)
    volume_map = load_submission_volumes_from_db()
    cluster_points_raw = get_cluster_points(depositors_df, cluster_result["labels"])
    for cp in cluster_points_raw:
        cp["volume"] = volume_map.get(cp["depositorId"], 0.0)

    recommendations = get_recommendations(cluster_result["centroids"], cluster_result["cluster_counts"])

    # --- prediction ---
    prediction_data: list[PredictionData] = []
    next_value = 0.0

    history = load_purchase_history_from_db()

    # Fall back to batch value history if payout history is too sparse
    if history.empty or len(history) < 3:
        logger.info("Payout history sparse, falling back to batch value history.")
        history = load_batch_value_history_from_db()

    if history is not None and not history.empty:
        forecast_result = forecast_fund(history, periods=1)

        for _, row in history.sort_values("ds").tail(6).iterrows():
            prediction_data.append(PredictionData(
                bulan=row["ds"].strftime("%Y-%m"),
                total_value=float(row["y"]),
                type="realisasi",
                volume_liter=float(row["volume_liter"]) if "volume_liter" in row else None,
                price_per_liter=float(row["price_per_liter"]) if "price_per_liter" in row else None,
            ))

        for f in forecast_result["forecast"]:
            prediction_data.append(PredictionData(
                bulan=pd.to_datetime(f["ds"]).strftime("%Y-%m"),
                total_value=f["yhat"],
                type="prediksi",
                volume_liter=f.get("volume_liter"),
                price_per_liter=f.get("price_per_liter"),
            ))

        next_value = forecast_result["next_value"] or 0.0

    return AIResponse(
        recommendations=[LocationRecommendation(**r) for r in recommendations],
        clusters=[ClusterPoint(**p) for p in cluster_points_raw],
        prediction=prediction_data,
        prediction_next_value=next_value,
    )


async def _background_analysis():
    """Runs the analysis in a thread pool so it doesn't block the event loop."""
    if _analysis_cache["is_running"]:
        logger.info("Analysis already running, skipping duplicate trigger.")
        return

    _analysis_cache["is_running"] = True
    try:
        loop = asyncio.get_event_loop()
        result: AIResponse = await loop.run_in_executor(None, _run_analysis)
        _analysis_cache["result"] = result
        _analysis_cache["computed_at"] = datetime.utcnow().isoformat() + "Z"
        logger.info("Background analysis complete. next_value=%.2f", result.prediction_next_value)
    except Exception as exc:
        logger.error("Background analysis failed: %s", exc, exc_info=True)
    finally:
        _analysis_cache["is_running"] = False


# ---------------------------------------------------------------------------
# Startup: run an initial analysis and verify DB connectivity
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    if not ping():
        logger.error("⚠️  Could not reach the database on startup. Check DATABASE_URL in .env.")
    else:
        logger.info("✅  Database connection OK.")
        # Warm the cache so the first /analyze response is instant
        asyncio.create_task(_background_analysis())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    db_ok = ping()
    return {
        "status": "ok",
        "database": "connected" if db_ok else "unreachable",
        "last_analysis": _analysis_cache["computed_at"],
        "analysis_running": _analysis_cache["is_running"],
    }


@app.get("/depositors")
async def get_depositors():
    return load_depositors_from_db()


@app.get("/collectors")
async def get_collectors():
    return load_collectors_from_db()


@app.post("/cluster")
async def cluster_endpoint(request: ClusterRequest):
    coords = [{"latitude": c.latitude, "longitude": c.longitude} for c in request.coordinates]
    if not coords:
        raise HTTPException(status_code=400, detail="No coordinates provided")

    n_clusters = request.n_clusters
    if n_clusters is None or n_clusters < 1:
        n_clusters = find_optimal_clusters(coords)

    return perform_clustering(coords, n_clusters)


@app.get("/cluster-from-db")
async def cluster_from_db(n_clusters: Optional[int] = None):
    """Cluster depositors loaded live from the database."""
    depositors = load_depositors_from_db()
    coords = [{"latitude": d["latitude"], "longitude": d["longitude"]} for d in depositors]

    if n_clusters is None or n_clusters < 1:
        n_clusters = find_optimal_clusters(coords)

    result = perform_clustering(coords, n_clusters)
    depositors_df = pd.DataFrame(depositors)
    cluster_points = get_cluster_points(depositors_df, result["labels"])
    recommendations = get_recommendations(result["centroids"], result["cluster_counts"])

    return {**result, "cluster_points": cluster_points, "recommendations": recommendations}


@app.get("/predict-fund")
async def predict_fund_endpoint():
    history = load_purchase_history_from_db()
    if history.empty or len(history) < 3:
        history = load_batch_value_history_from_db()
    if history.empty:
        raise HTTPException(status_code=404, detail="No volume and price history found in database.")
    return forecast_fund(history, periods=1)


@app.get("/analyze", response_model=AIResponse)
async def analyze(background_tasks: BackgroundTasks, refresh: bool = False):
    """
    Returns the latest cached analysis result.

    Pass ?refresh=true to force a synchronous re-run (slower but always fresh).
    Otherwise the result is served from cache and updated in the background.
    """
    if refresh:
        result = _run_analysis()
        _analysis_cache["result"] = result
        _analysis_cache["computed_at"] = datetime.utcnow().isoformat() + "Z"
        return result

    if _analysis_cache["result"] is None:
        # Cache is cold — run synchronously for the first caller
        result = _run_analysis()
        _analysis_cache["result"] = result
        _analysis_cache["computed_at"] = datetime.utcnow().isoformat() + "Z"
        return result

    # Serve stale cache, refresh in background for next caller
    background_tasks.add_task(_background_analysis)
    return _analysis_cache["result"]


# ---------------------------------------------------------------------------
# Webhook — called by the backend whenever new data is inserted
# ---------------------------------------------------------------------------

@app.post("/webhook/new-data")
async def webhook_new_data(
    request: Request,
    background_tasks: BackgroundTasks,
    x_webhook_signature: Optional[str] = Header(None),
):
    """
    Receives a POST from the backend whenever a new OilSubmission or Payout
    is created. Triggers a background re-analysis so /analyze stays fresh.

    Optional signature verification:
      Set WEBHOOK_SECRET in .env. The backend must send:
        X-Webhook-Signature: sha256=<hmac_hex>
      computed as HMAC-SHA256(secret, raw_request_body).

    Payload (optional, for logging):
        { "event": "submission.created" | "payout.paid" | "batch.approved",
          "id": "<record_id>" }
    """
    # Verify signature if a secret is configured
    if WEBHOOK_SECRET:
        if not x_webhook_signature:
            raise HTTPException(status_code=401, detail="Missing X-Webhook-Signature header.")
        body = await request.body()
        expected = "sha256=" + hmac.new(
            WEBHOOK_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, x_webhook_signature):
            raise HTTPException(status_code=403, detail="Invalid webhook signature.")

    try:
        payload = await request.json()
    except Exception:
        payload = {}

    event = payload.get("event", "unknown")
    record_id = payload.get("id", "")
    logger.info("Webhook received: event=%s id=%s — scheduling re-analysis.", event, record_id)

    background_tasks.add_task(_background_analysis)

    return {
        "status": "accepted",
        "message": "Re-analysis scheduled.",
        "event": event,
        "id": record_id,
    }
