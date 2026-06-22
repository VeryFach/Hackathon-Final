import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import logging
from collections import Counter

logger = logging.getLogger(__name__)

def perform_clustering(coords, n_clusters):
    if not coords:
        raise ValueError("No coordinates provided")
    
    n_clusters = max(1, n_clusters)  # ensure at least 1
    if n_clusters > len(coords):
        n_clusters = len(coords)
    
    X = np.array([[c['latitude'], c['longitude']] for c in coords])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    centroids = scaler.inverse_transform(kmeans.cluster_centers_)
    
    counts = {int(k): int(v) for k, v in Counter(labels).items()}
    return {
        'labels': labels.tolist(),
        'centroids': centroids.tolist(),
        'cluster_counts': counts,
    }

def find_optimal_clusters(coords, max_k=10):
    n_points = len(coords)
    if n_points == 0:
        return 1
    max_k = min(max_k, n_points)
    X = np.array([[c['latitude'], c['longitude']] for c in coords])
    inertias = []
    for k in range(1, max_k + 1):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X)
        inertias.append(kmeans.inertia_)
    
    if len(inertias) > 2:
        diffs = [inertias[i-1] - inertias[i] for i in range(1, len(inertias))]
        if diffs:
            threshold = diffs[0] * 0.05
            for i, d in enumerate(diffs, start=1):
                if d < threshold:
                    return max(1, i)
    return min(3, max(1, n_points))

def get_cluster_points(depositors_df, labels):
    points = []
    for idx, row in depositors_df.iterrows():
        points.append({
            'depositorId': row['id'],
            'latitude': float(row['latitude']),
            'longitude': float(row['longitude']),
            'volume': 0,
            'cluster': int(labels[idx]),
        })
    return points

def get_recommendations(centroids, cluster_counts):
    recommendations = []
    for i, (centroid, count) in enumerate(zip(centroids, cluster_counts.values())):
        lat, lon = centroid
        recommendations.append({
            'latitude': float(lat),
            'longitude': float(lon),
            'cluster': i,
            'score': float(count),
            'nama': f'Lokasi Rekomendasi {chr(65+i)}',
        })
    return recommendations