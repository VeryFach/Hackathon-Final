import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def recommend_collector_locations(depositors_df, n_clusters=3):
    """
    Berdasarkan lokasi penyetor (lat, long) dan volume, lakukan clustering
    untuk merekomendasikan lokasi pengepul baru.
    Output: DataFrame dengan koordinat pusat cluster dan skor.
    """
    # Ambil fitur: latitude, longitude, dan volume (bobot)
    X = depositors_df[['latitude', 'longitude']].copy()
    # Tambahkan bobot volume (opsional)
    X['volume_scaled'] = depositors_df['volume'] / depositors_df['volume'].max()  # normalisasi
    
    # Standardisasi fitur lokasi
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X[['latitude', 'longitude']])
    # Bobot volume tidak perlu distandardisasi karena sudah dinormalisasi
    # Kita gabungkan dengan bobot: kita kalikan koordinat dengan bobot volume agar titik dengan volume besar lebih berpengaruh
    weights = X['volume_scaled'].values.reshape(-1, 1)
    X_weighted = X_scaled * (1 + weights)  # volume besar -> koordinat lebih "ditarik"
    
    # KMeans clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(X_weighted)
    labels = kmeans.labels_
    centers = kmeans.cluster_centers_
    
    # Kembalikan ke skala asli
    centers_original = scaler.inverse_transform(centers)
    
    # Buat DataFrame hasil
    result = pd.DataFrame(centers_original, columns=['latitude', 'longitude'])
    result['cluster'] = range(n_clusters)
    # Hitung skor: kepadatan penyetor di sekitar cluster (jumlah point dalam radius 0.02 derajat)
    scores = []
    for i, row in result.iterrows():
        # Hitung jarak setiap depositor ke pusat cluster ini
        dist = np.sqrt((depositors_df['latitude'] - row['latitude'])**2 + (depositors_df['longitude'] - row['longitude'])**2)
        # Jumlah depositor dalam radius 0.02 derajat (sekitar 2.2 km)
        count = np.sum(dist < 0.02)
        # Volume total di area tersebut
        total_volume = depositors_df[dist < 0.02]['volume'].sum()
        # Skor kombinasi: jumlah + volume normalisasi
        score = count + total_volume / 100  # normalisasi volume
        scores.append(round(score, 2))
    result['score'] = scores
    result['nama'] = [f'Lokasi Rekomendasi {chr(65+i)}' for i in range(n_clusters)]
    return result

def get_cluster_data(depositors_df, n_clusters=3):
    """
    Untuk visualisasi, kembalikan data clustering: setiap titik dengan label cluster.
    """
    X = depositors_df[['latitude', 'longitude']].copy()
    X['volume_scaled'] = depositors_df['volume'] / depositors_df['volume'].max()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X[['latitude', 'longitude']])
    weights = X['volume_scaled'].values.reshape(-1, 1)
    X_weighted = X_scaled * (1 + weights)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_weighted)
    depositors_df['cluster'] = labels
    return depositors_df[['depositor_id', 'latitude', 'longitude', 'volume', 'cluster']]