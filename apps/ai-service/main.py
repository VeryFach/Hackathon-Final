# apps/ai-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler 
import logging
from collections import Counter

app = FastAPI(title="SAF AI Service - Clustering", version="1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Request/Response models
class Coordinate(BaseModel):
    latitude: float
    longitude: float

class ClusterRequest(BaseModel):
    coordinates: List[Coordinate]
    n_clusters: Optional[int] = None

class ClusterResponse(BaseModel):
    labels: List[int]
    centroids: List[List[float]]
    cluster_counts: dict
    recommended_centroids: List[List[float]]

# ---------- Helper functions ----------
def find_optimal_clusters(coords, max_k=10):
    """Elbow method to suggest optimal k."""
    n_points = len(coords)
    if n_points == 0:
        return 1
    max_k = min(max_k, n_points)
    inertias = []
    for k in range(1, max_k + 1):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(coords)
        inertias.append(kmeans.inertia_)
    if len(inertias) > 2:
        diffs = [inertias[i-1] - inertias[i] for i in range(1, len(inertias))]
        if diffs:
            threshold = diffs[0] * 0.05
            for i, d in enumerate(diffs, start=1):
                if d < threshold:
                    return i
    return min(3, n_points)

def perform_clustering(coords, n_clusters):
    """Clustering murni berdasarkan koordinat (tanpa volume)."""
    if len(coords) == 0:
        raise ValueError("No coordinates")
    if n_clusters < 1:
        n_clusters = 1
    if n_clusters > len(coords):
        n_clusters = len(coords)
    
    # 🔥 Tanpa StandardScaler (karena lat/lon sudah dalam skala yang sama)
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(coords)
    centroids = kmeans.cluster_centers_.tolist()
    return labels.tolist(), centroids

# ---------- Endpoints ----------
@app.post("/cluster", response_model=ClusterResponse)
async def cluster_endpoint(request: ClusterRequest):
    if not request.coordinates:
        raise HTTPException(status_code=400, detail="No coordinates provided")
    
    coords = np.array([[c.latitude, c.longitude] for c in request.coordinates])
    n_clusters = request.n_clusters
    if n_clusters is None:
        n_clusters = find_optimal_clusters(coords)
        logger.info(f"Auto-selected n_clusters = {n_clusters}")
    
    labels, centroids = perform_clustering(coords, n_clusters)
    counts = dict(Counter(labels))
    
    return ClusterResponse(
        labels=labels,
        centroids=centroids,
        cluster_counts=counts,
        recommended_centroids=centroids
    )

@app.get("/cluster-from-csv")
async def cluster_from_csv(n_clusters: Optional[int] = None):
    """Read depositors from CSV and cluster them (lokasi only)."""
    try:
        df = pd.read_csv('data/depositors.csv')
        # 🔥 Hanya pakai latitude dan longitude
        coords = df[['latitude', 'longitude']].values.tolist()
        request = ClusterRequest(
            coordinates=[Coordinate(latitude=c[0], longitude=c[1]) for c in coords],
            n_clusters=n_clusters
        )
        return await cluster_endpoint(request)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="data/depositors.csv not found. Run data_generator.py first.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/depositors")
async def get_depositors():
    """Get depositor coordinates from CSV."""
    try:
        df = pd.read_csv('data/depositors.csv')
        return df[['latitude', 'longitude']].to_dict('records')
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="data/depositors.csv not found")

@app.get("/health")
async def health():
    return {"status": "ok"}