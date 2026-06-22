"""
db_queries.py
-------------
Fetches data from PostgreSQL tables that match the Prisma schema in schema.prisma.
Every function returns a pandas DataFrame with the same column names the rest of the
codebase expects, so the clustering / prediction logic needs zero changes.

Table mapping (Prisma model → PostgreSQL table):
  DepositorProfile  → depositor_profiles
  CollectorProfile  → collector_profiles
  OilSubmission     → oil_submissions
  Batch             → batches
  BatchPricing      → batch_pricings
  Payout            → payouts
"""

import logging
import pandas as pd
from sqlalchemy import text
from .database import get_db_connection

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Depositors
# ---------------------------------------------------------------------------

def load_depositors_from_db() -> list[dict]:
    """
    Returns a list of dicts compatible with the old depositors.csv format:
        id, latitude, longitude, address
    Each row corresponds to one DepositorProfile joined to its User.
    """
    query = text("""
        SELECT
            dp.id,
            dp.latitude::float        AS latitude,
            dp.longitude::float       AS longitude,
            dp.address,
            u.full_name               AS nama,
            u.email
        FROM depositor_profiles dp
        JOIN users u ON u.id = dp."userId"
        ORDER BY dp.id
    """)
    with get_db_connection() as conn:
        df = pd.read_sql(query, conn)

    if df.empty:
        logger.warning("No depositor profiles found in database.")
    logger.info("Loaded %d depositors from database.", len(df))
    return df.to_dict("records")


# ---------------------------------------------------------------------------
# Collectors
# ---------------------------------------------------------------------------

def load_collectors_from_db() -> list[dict]:
    """
    Returns a list of dicts compatible with the old collectors.csv format:
        id, nama, latitude, longitude, address, service_radius_km, capacity_liter
    """
    query = text("""
        SELECT
            cp.id,
            u.full_name               AS nama,
            cp.latitude::float        AS latitude,
            cp.longitude::float       AS longitude,
            cp.warehouse_address      AS address,
            cp.service_radius_km,
            cp.capacity_liter
        FROM collector_profiles cp
        JOIN users u ON u.id = cp."userId"
        ORDER BY cp.id
    """)
    with get_db_connection() as conn:
        df = pd.read_sql(query, conn)

    logger.info("Loaded %d collectors from database.", len(df))
    return df.to_dict("records")


# ---------------------------------------------------------------------------
# Purchase / payout history  →  prediction feed
# ---------------------------------------------------------------------------

def load_purchase_history_from_db() -> pd.DataFrame:
    """
    Aggregates completed Payouts by calendar month.
    Returns a DataFrame with columns:
        ds  (datetime, first day of the month)
        y   (float, total payout amount in that month)

    This replaces purchase_history.csv and feeds directly into Prophet.

    Logic:
      - Use Payout.amount where Payout.status = 'paid' and paid_at IS NOT NULL.
      - Truncate paid_at to the month boundary so Prophet sees monthly cadence.
    """
    query = text("""
        SELECT
            DATE_TRUNC('month', p.paid_at)  AS ds,
            SUM(p.amount)                   AS y
        FROM payouts p
        WHERE p.status = 'paid'
          AND p.paid_at IS NOT NULL
        GROUP BY DATE_TRUNC('month', p.paid_at)
        ORDER BY ds
    """)
    with get_db_connection() as conn:
        df = pd.read_sql(query, conn, parse_dates=["ds"])

    if df.empty:
        logger.warning("No paid payout history found in database.")
        return df

    df["y"] = df["y"].astype(float)
    logger.info("Loaded %d months of payout history from database.", len(df))
    return df


# ---------------------------------------------------------------------------
# Submission volume — supplementary enrichment for cluster points
# ---------------------------------------------------------------------------

def load_submission_volumes_from_db() -> dict[str, float]:
    """
    Returns a dict keyed by depositor_profile id → total actual oil (litres).
    Used to enrich cluster points with real volume data instead of 0.

    Only counts submissions whose actual_liter is set (i.e. picked up / completed).
    """
    query = text("""
        SELECT
            "depositorId",
            COALESCE(SUM(actual_liter), 0) AS total_volume
        FROM oil_submissions
        WHERE actual_liter IS NOT NULL
        GROUP BY "depositorId"
    """)
    with get_db_connection() as conn:
        df = pd.read_sql(query, conn)

    return dict(zip(df["depositorId"], df["total_volume"].astype(float)))


# ---------------------------------------------------------------------------
# Batch value history — alternative prediction feed (approved batches)
# ---------------------------------------------------------------------------

def load_batch_value_history_from_db() -> pd.DataFrame:
    """
    Monthly total_value from approved BatchPricings.
    Use this as an *alternative* to payout history if payouts are sparse.

    Returns DataFrame with columns: ds, y
    """
    query = text("""
        SELECT
            DATE_TRUNC('month', b.created_at)   AS ds,
            SUM(bp.total_value)                 AS y
        FROM batch_pricings bp
        JOIN batches b ON b.id = bp."batchId"
        WHERE b.status = 'approved'
        GROUP BY DATE_TRUNC('month', b.created_at)
        ORDER BY ds
    """)
    with get_db_connection() as conn:
        df = pd.read_sql(query, conn, parse_dates=["ds"])

    df["y"] = df["y"].astype(float)
    logger.info("Loaded %d months of batch value history from database.", len(df))
    return df