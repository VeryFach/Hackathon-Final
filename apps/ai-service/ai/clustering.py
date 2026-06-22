import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def recommend_collector_locations(depositors_df, n_clusters=3):
    """
    Berdasarkan lokasi penyetor (lat, long) SAJA, lakukan clustering
    untuk merekomendasikan lokasi pengepul baru.
    Output: DataFrame dengan koordinat pusat cluster dan skor.
    """
    # Ambil fitur: latitude, longitude (tanpa volume)
    X = depositors_df[['latitude', 'longitude']].copy()
    
    # Standardisasi fitur lokasi (opsional, tapi membantu clustering)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # KMeans clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    labels = kmeans.labels_
    centers = kmeans.cluster_centers_
    
    # Kembalikan ke skala asli
    centers_original = scaler.inverse_transform(centers)
    
    # Buat DataFrame hasil
    result = pd.DataFrame(centers_original, columns=['latitude', 'longitude'])
    result['cluster'] = range(n_clusters)
    result['nama'] = [f'Lokasi Rekomendasi {chr(65+i)}' for i in range(n_clusters)]
    
    # Hitung skor: jumlah depositor dalam radius 0.02 derajat
    scores = []
    for i, row in result.iterrows():
        dist = np.sqrt((depositors_df['latitude'] - row['latitude'])**2 + 
                       (depositors_df['longitude'] - row['longitude'])**2)
        count = np.sum(dist < 0.02)
        scores.append(count)
    result['score'] = scores
    
    return result

def get_cluster_data(depositors_df, n_clusters=3):
    """
    Untuk visualisasi, kembalikan data clustering: setiap titik dengan label cluster.
    """
    X = depositors_df[['latitude', 'longitude']].copy()
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    
    depositors_df['cluster'] = labels
    return depositors_df[['depositor_id', 'latitude', 'longitude', 'cluster']]