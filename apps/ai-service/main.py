# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import logging
from typing import Optional

from models.schemas import (
    AIResponse, LocationRecommendation, ClusterPoint,
    PredictionData, ClusterRequest, Coordinate
)
from ai.clustering import (
    perform_clustering, find_optimal_clusters,
    get_cluster_points, get_recommendations
)
from ai.prediction import forecast_fund

app = FastAPI(title="SAF AI Service", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_depositors():
    try:
        df = pd.read_csv('data/depositors.csv')
        return df.to_dict('records')
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="data/depositors.csv not found")

def load_purchase_history():
    try:
        df = pd.read_csv('data/purchase_history.csv')
        df['ds'] = pd.to_datetime(df['ds'])
        return df
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="data/purchase_history.csv not found")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/depositors")
async def get_depositors():
    return load_depositors()

@app.post("/cluster")
async def cluster_endpoint(request: ClusterRequest):
    coords = [{'latitude': c.latitude, 'longitude': c.longitude} for c in request.coordinates]
    if not coords:
        raise HTTPException(status_code=400, detail="No coordinates provided")
    
    n_clusters = request.n_clusters
    if n_clusters is None or n_clusters < 1:
        n_clusters = find_optimal_clusters(coords)
        logger.info(f"Auto-selected n_clusters = {n_clusters}")
    
    result = perform_clustering(coords, n_clusters)
    return result

@app.get("/cluster-from-csv")
async def cluster_from_csv(n_clusters: Optional[int] = None):
    depositors = load_depositors()
    coords = [{'latitude': d['latitude'], 'longitude': d['longitude']} for d in depositors]
    
    if n_clusters is None or n_clusters < 1:
        n_clusters = find_optimal_clusters(coords)
        logger.info(f"Auto-selected n_clusters = {n_clusters}")
    
    result = perform_clustering(coords, n_clusters)
    depositors_df = pd.DataFrame(depositors)
    cluster_points = get_cluster_points(depositors_df, result['labels'])
    recommendations = get_recommendations(result['centroids'], result['cluster_counts'])
    
    return {
        **result,
        'cluster_points': cluster_points,
        'recommendations': recommendations,
    }

@app.get("/predict-fund")
async def predict_fund():
    history = load_purchase_history()
    if history.empty:
        raise HTTPException(status_code=404, detail="No purchase history found")
    result = forecast_fund(history, periods=1)
    return result

@app.get("/analyze", response_model=AIResponse)
async def analyze():
    depositors = load_depositors()
    history = load_purchase_history()
    
    if not depositors:
        raise HTTPException(status_code=400, detail="No depositor data found")
    
    coords = [{'latitude': d['latitude'], 'longitude': d['longitude']} for d in depositors]
    n_clusters = find_optimal_clusters(coords)
    logger.info(f"Using n_clusters = {n_clusters}")
    
    cluster_result = perform_clustering(coords, n_clusters)
    depositors_df = pd.DataFrame(depositors)
    cluster_points = get_cluster_points(depositors_df, cluster_result['labels'])
    recommendations = get_recommendations(cluster_result['centroids'], cluster_result['cluster_counts'])
    
    prediction_data = []
    next_value = 0.0
    
    if history is not None and not history.empty:
        forecast_result = forecast_fund(history, periods=1)
        history_sorted = history.sort_values('ds').tail(6)
        for _, row in history_sorted.iterrows():
            prediction_data.append(PredictionData(
                bulan=row['ds'].strftime('%Y-%m'),
                total_value=float(row['y']),
                type='realisasi'
            ))
        for f in forecast_result['forecast']:
            prediction_data.append(PredictionData(
                bulan=pd.to_datetime(f['ds']).strftime('%Y-%m'),
                total_value=f['yhat'],
                type='prediksi'
            ))
        next_value = forecast_result['next_value'] or 0.0
    
    return AIResponse(
        recommendations=[LocationRecommendation(**r) for r in recommendations],
        clusters=[ClusterPoint(**p) for p in cluster_points],
        prediction=prediction_data,
        prediction_next_value=next_value
    )