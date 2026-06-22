import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures

def predict_funds(batches_df, months_ahead=1):
    """
    Prediksi total nilai pembelian (dana) untuk bulan depan.
    Menggunakan regresi linier atau polinomial terhadap waktu.
    Output: prediksi total dana untuk bulan depan (dalam juta Rupiah).
    """
    # Group by month
    batches_df['year_month'] = batches_df['date'].dt.to_period('M')
    monthly = batches_df.groupby('year_month').agg({
        'total_value': 'sum',
        'volume': 'sum'
    }).reset_index()
    monthly['period'] = range(1, len(monthly) + 1)
    
    # Fitur: period (bulan ke-)
    X = monthly[['period']].values
    y = monthly['total_value'].values / 1_000_000  # konversi ke juta
    
    if len(X) < 3:
        # Jika data kurang, gunakan rata-rata
        pred_value = np.mean(y)
    else:
        # Gunakan polynomial regression degree 2 jika data cukup
        poly = PolynomialFeatures(degree=2)
        X_poly = poly.fit_transform(X)
        model = LinearRegression()
        model.fit(X_poly, y)
        # Prediksi untuk bulan berikutnya
        next_period = len(X) + months_ahead
        X_pred = poly.transform([[next_period]])
        pred_value = model.predict(X_pred)[0]
        if pred_value < 0:
            pred_value = np.mean(y)  # fallback
    
    # Siapkan data untuk visualisasi (history + prediksi)
    last_month = monthly['year_month'].max()
    # Tambahkan prediksi untuk bulan depan
    next_month = last_month + 1
    # History
    history = monthly[['period', 'total_value']].copy()
    history['total_value'] = history['total_value'] / 1_000_000  # juta
    history['type'] = 'realisasi'
    # Prediksi untuk bulan depan
    pred_row = pd.DataFrame({
        'period': [next_month],
        'total_value': [pred_value],
        'type': ['prediksi']
    })
    combined = pd.concat([history, pred_row], ignore_index=True)
    # Format bulan
    combined['bulan'] = combined['period'].apply(lambda x: f'Bulan {x}')
    return combined.to_dict('records'), pred_value