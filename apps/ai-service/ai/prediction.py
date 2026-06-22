import logging

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def _prepare_history(history_df: pd.DataFrame) -> pd.DataFrame:
    df = history_df.copy()
    df["ds"] = pd.to_datetime(df["ds"])

    if "volume_liter" not in df.columns or "price_per_liter" not in df.columns:
        if "y" not in df.columns:
            raise ValueError("Prediction history must contain y or volume/price columns.")

        # Compatibility fallback for old feeds. This keeps the endpoint alive,
        # but real deployments should provide volume_liter and price_per_liter.
        df["volume_liter"] = 1.0
        df["price_per_liter"] = df["y"].astype(float)

    df["volume_liter"] = df["volume_liter"].astype(float)
    df["price_per_liter"] = df["price_per_liter"].astype(float)
    df["y"] = df.get("y", df["volume_liter"] * df["price_per_liter"]).astype(float)

    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=["ds", "volume_liter", "price_per_liter"])
    df = df[(df["volume_liter"] > 0) & (df["price_per_liter"] > 0)]
    return df.sort_values("ds")


def _month_starts_after(last_date: pd.Timestamp, periods: int) -> list[pd.Timestamp]:
    start = (last_date + pd.offsets.MonthBegin(1)).normalize()
    return list(pd.date_range(start=start, periods=periods, freq="MS"))


def _forecast_with_trend(values: np.ndarray, periods: int) -> np.ndarray:
    if len(values) == 1:
        return np.repeat(values[-1], periods)

    window = values[-min(3, len(values)) :]
    recent_slope = np.diff(window).mean() if len(window) > 1 else 0.0
    return np.array([values[-1] + recent_slope * step for step in range(1, periods + 1)])


def _forecast_volume_price_var(df: pd.DataFrame, periods: int) -> tuple[np.ndarray, np.ndarray]:
    series = np.log1p(df[["volume_liter", "price_per_liter"]].to_numpy(dtype=float))

    if len(series) < 4:
        logger.info("History too short for VAR(1), using trend fallback.")
        volume = _forecast_with_trend(df["volume_liter"].to_numpy(dtype=float), periods)
        price = _forecast_with_trend(df["price_per_liter"].to_numpy(dtype=float), periods)
        return np.maximum(volume, 0), np.maximum(price, 0)

    # VAR(1): x_t = c + A*x_{t-1}. Estimated with least squares.
    x_prev = series[:-1]
    x_next = series[1:]
    design = np.column_stack([np.ones(len(x_prev)), x_prev])
    coefficients, *_ = np.linalg.lstsq(design, x_next, rcond=None)

    current = series[-1]
    forecasts = []

    for _ in range(periods):
        current = np.r_[1.0, current] @ coefficients
        forecasts.append(np.expm1(current))

    forecast_arr = np.maximum(np.array(forecasts), 0)
    return forecast_arr[:, 0], forecast_arr[:, 1]


def forecast_fund(history_df: pd.DataFrame, periods: int = 1) -> dict:
    """
    Forecast future fund requirements from volume and price history.

    The model predicts monthly oil volume and effective price per liter together,
    then derives fund need as:

        total_value = predicted_volume_liter * predicted_price_per_liter

    A lightweight VAR(1) model is used when enough monthly observations exist.
    For sparse data, it falls back to a short moving trend.
    """
    if history_df.empty:
        return {"forecast": [], "next_value": None}

    df = _prepare_history(history_df)
    if len(df) < 2:
        return {"forecast": [], "next_value": None}

    volume_forecast, price_forecast = _forecast_volume_price_var(df, periods)
    future_months = _month_starts_after(df["ds"].iloc[-1], periods)

    forecast = []
    for ds, volume, price in zip(future_months, volume_forecast, price_forecast):
        total_value = float(volume * price)
        forecast.append(
            {
                "ds": ds.isoformat(),
                "volume_liter": round(float(volume), 2),
                "price_per_liter": round(float(price), 2),
                "yhat": round(total_value, 2),
                "yhat_lower": round(total_value * 0.9, 2),
                "yhat_upper": round(total_value * 1.1, 2),
            }
        )

    return {
        "forecast": forecast,
        "next_value": forecast[-1]["yhat"] if forecast else None,
        "next_volume_liter": forecast[-1]["volume_liter"] if forecast else None,
        "next_price_per_liter": forecast[-1]["price_per_liter"] if forecast else None,
    }
