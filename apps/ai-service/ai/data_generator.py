# apps/ai-service/data_generator.py
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
import os

# Seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_depositors(n=120, lat_center=-6.2088, lon_center=106.8456, radius=0.5):
    """
    Generate random depositor coordinates.
    Default: Jakarta area
    """
    lats = np.random.normal(lat_center, radius, n)
    lons = np.random.normal(lon_center, radius, n)
    # Clip to reasonable range
    lats = np.clip(lats, -6.8, -5.8)
    lons = np.clip(lons, 106.0, 107.5)
    
    depositors = pd.DataFrame({
        'id': [f'dep_{i:03d}' for i in range(n)],
        'latitude': lats,
        'longitude': lons,
        'address': [f'Jl. Contoh {i}' for i in range(n)],
    })
    return depositors

def generate_purchase_history(months=12, base=100, trend=50, seasonal_amp=10):
    """
    Generate monthly purchase history (in million Rupiah).
    Simulates: base + increasing trend + seasonality + noise
    """
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30*months)
    dates = pd.date_range(start=start_date, periods=months, freq='MS')
    
    # Trend: linear increase
    trend_line = np.linspace(0, trend, months)
    # Seasonality: sine wave
    seasonal = seasonal_amp * np.sin(np.linspace(0, 2*np.pi, months))
    # Random noise
    noise = np.random.normal(0, 5, months)
    
    values = base + trend_line + seasonal + noise
    values = np.maximum(values, 20)  # minimum 20 juta
    
    history = pd.DataFrame({
        'ds': dates,
        'y': values.astype(int),
    })
    return history

if __name__ == "__main__":
    # Create data directory if not exists
    os.makedirs('data', exist_ok=True)
    
    # Generate depositors
    depositors = generate_depositors(120)
    depositors.to_csv('data/depositors.csv', index=False)
    print(f"✅ Generated {len(depositors)} depositors -> data/depositors.csv")
    print(depositors.head())
    
    # Generate purchase history
    history = generate_purchase_history(12)
    history.to_csv('data/purchase_history.csv', index=False)
    print(f"✅ Generated {len(history)} months of purchase history -> data/purchase_history.csv")
    print(history.head())
    
    print("\n🎉 Data generation complete!")