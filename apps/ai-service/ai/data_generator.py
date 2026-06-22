import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random
from typing import List, Tuple

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

# Konfigurasi cluster (misal 3 cluster untuk wilayah)
CLUSTER_CENTERS = [
    {'lat': -6.2, 'lon': 106.8, 'label': 'Jakarta Pusat'},
    {'lat': -6.3, 'lon': 106.9, 'label': 'Jakarta Selatan'},
    {'lat': -6.1, 'lon': 106.7, 'label': 'Jakarta Utara'},
]

def generate_depositors(n: int = 100) -> pd.DataFrame:
    """Generate depositor profiles with coordinates and estimated monthly volume."""
    data = []
    for i in range(n):
        # Pilih cluster acak
        cluster = random.choice(CLUSTER_CENTERS)
        # Tambahkan noise
        lat = cluster['lat'] + np.random.normal(0, 0.05)
        lon = cluster['lon'] + np.random.normal(0, 0.05)
        # Volume minyak per bulan (liter) ~ 10-200 L
        monthly_volume = np.random.randint(10, 200)
        data.append({
            'depositor_id': f'dep_{i+1:04d}',
            'latitude': lat,
            'longitude': lon,
            'monthly_volume': monthly_volume,
            'cluster_label': cluster['label']
        })
    return pd.DataFrame(data)

def generate_collectors(m: int = 5) -> pd.DataFrame:
    """Generate collector profiles with capacity and service radius."""
    data = []
    for i in range(m):
        # Letakkan pengepul di sekitar cluster
        cluster = random.choice(CLUSTER_CENTERS)
        lat = cluster['lat'] + np.random.normal(0, 0.03)
        lon = cluster['lon'] + np.random.normal(0, 0.03)
        capacity = np.random.randint(500, 3000)  # liter
        radius = np.random.uniform(5, 15)  # km
        data.append({
            'collector_id': f'col_{i+1:04d}',
            'latitude': lat,
            'longitude': lon,
            'capacity': capacity,
            'service_radius': radius
        })
    return pd.DataFrame(data)

def generate_transactions(depositors: pd.DataFrame, 
                          collectors: pd.DataFrame,
                          start_date: str = '2024-01-01',
                          months: int = 6) -> pd.DataFrame:
    """Generate oil submissions and batch pricings over time."""
    start = datetime.strptime(start_date, '%Y-%m-%d')
    submissions = []
    batch_pricings = []
    
    # Untuk setiap bulan
    for m in range(months):
        month_start = start + timedelta(days=30*m)
        # Setiap depositor setor beberapa kali dalam bulan (1-3 kali)
        for _, dep in depositors.iterrows():
            num_submissions = np.random.randint(1, 4)
            for _ in range(num_submissions):
                day = np.random.randint(1, 28)
                date = month_start + timedelta(days=day)
                volume = int(dep['monthly_volume'] * np.random.uniform(0.3, 0.8))
                # Pilih collector acak
                collector = collectors.sample(1).iloc[0]
                # Simulasi harga per liter (Rp) tergantung grade (A, B, C)
                # Kita gunakan random grade dengan harga
                grade = np.random.choice(['A', 'B', 'C'], p=[0.2, 0.5, 0.3])
                price_per_liter = {
                    'A': 14000, 'B': 12000, 'C': 10000
                }[grade]
                total_value = volume * price_per_liter
                submissions.append({
                    'submission_id': f'sub_{len(submissions)+1:06d}',
                    'depositor_id': dep['depositor_id'],
                    'collector_id': collector['collector_id'],
                    'date': date.strftime('%Y-%m-%d'),
                    'volume': volume,
                    'grade': grade,
                    'price_per_liter': price_per_liter,
                    'total_value': total_value
                })
        # Batch pricing per bulan (agregasi)
        # Untuk prediksi dana, kita ambil total per bulan
        month_total = sum([s['total_value'] for s in submissions if s['date'].startswith(month_start.strftime('%Y-%m'))])
        if month_total > 0:
            batch_pricings.append({
                'month': month_start.strftime('%Y-%m'),
                'total_value': month_total
            })
    
    df_submissions = pd.DataFrame(submissions)
    df_batch = pd.DataFrame(batch_pricings)
    return df_submissions, df_batch

def generate_all_data(depositors_n=200, collectors_m=5, months=12):
    """Generate all data and save to CSV files."""
    depositors = generate_depositors(depositors_n)
    collectors = generate_collectors(collectors_m)
    submissions, batch_pricings = generate_transactions(depositors, collectors, months=months)
    
    # Save to CSV
    depositors.to_csv('data/depositors.csv', index=False)
    collectors.to_csv('data/collectors.csv', index=False)
    submissions.to_csv('data/submissions.csv', index=False)
    batch_pricings.to_csv('data/batch_pricings.csv', index=False)
    
    print(f"Generated {len(depositors)} depositors, {len(collectors)} collectors, {len(submissions)} submissions, {len(batch_pricings)} batch pricings.")
    return depositors, collectors, submissions, batch_pricings

if __name__ == '__main__':
    # Buat folder data jika belum ada
    import os
    os.makedirs('data', exist_ok=True)
    generate_all_data()