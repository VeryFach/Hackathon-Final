# apps/ai-service/ai/prediction.py
import pandas as pd
import numpy as np
from prophet import Prophet
import logging

logger = logging.getLogger(__name__)

def forecast_fund(history_df: pd.DataFrame, periods: int = 1) -> dict:
    """
    Forecast future fund requirements using Prophet.
    
    Returns:
        dict with keys: 'forecast' (list) and 'next_value' (float)
    """
    if history_df.empty or len(history_df) < 2:
        return {'forecast': [], 'next_value': None}
    
    df = history_df[['ds', 'y']].copy()
    df['ds'] = pd.to_datetime(df['ds'])
    df['y'] = df['y'].astype(float)
    
    # If too few points, adjust changepoints
    n_changepoints = min(5, len(df) - 1)
    model = Prophet(
        yearly_seasonality=False,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        n_changepoints=n_changepoints,
    )
    model.fit(df)
    
    future = model.make_future_dataframe(periods=periods, freq='MS')
    forecast = model.predict(future)
    
    forecasted = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
    
    result = {
        'forecast': [],
        'next_value': None,
    }
    
    for _, row in forecasted.iterrows():
        result['forecast'].append({
            'ds': row['ds'].isoformat(),
            'yhat': round(row['yhat'], 2),
            'yhat_lower': round(row['yhat_lower'], 2),
            'yhat_upper': round(row['yhat_upper'], 2),
        })
    
    if not forecasted.empty:
        result['next_value'] = round(forecasted.iloc[-1]['yhat'], 2)
    
    return result