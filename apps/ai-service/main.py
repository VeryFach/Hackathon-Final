from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from typing import List
from .ai.data_generator import generate_depositors, generate_collectors, generate_batches
from .ai.clustering import recommend_collector_locations, get_cluster_data
from .ai.prediction import predict_funds
from .models.schemas import AIResponse, LocationRecommendation, ClusterPoint, PredictionData

app = FastAPI(title="AI Service for Hackathon SAF", version="1.0")

# CORS untuk diakses dari frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data dummy global (akan di-generate sekali saat startup)
depositors = None
collectors = None
batches = None

@app.on_event("startup")
def load_data():
    global depositors, collectors, batches
    # Generate data dengan seed tetap
    depositors = generate_depositors(n=120)
    collectors = generate_collectors(n=8)
    batches = generate_batches(depositors, collectors, months=6)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/ai/recommendations", response_model=AIResponse)
def get_ai_recommendations():
    """
    Endpoint untuk mendapatkan rekomendasi lokasi pengepul (clustering)
    dan prediksi dana berdasarkan data yang ada.
    """
    global depositors, collectors, batches
    if depositors is None or batches is None:
        raise HTTPException(status_code=500, detail="Data not initialized")
    
    # 1. Rekomendasi lokasi (clustering)
    rec_df = recommend_collector_locations(depositors, n_clusters=3)
    recommendations = [
        LocationRecommendation(
            latitude=row['latitude'],
            longitude=row['longitude'],
            cluster=int(row['cluster']),
            score=float(row['score']),
            nama=row['nama']
        )
        for _, row in rec_df.iterrows()
    ]
    
    # 2. Data clustering untuk visualisasi
    cluster_data = get_cluster_data(depositors, n_clusters=3)
    clusters = [
        ClusterPoint(
            depositor_id=row['depositor_id'],
            latitude=float(row['latitude']),
            longitude=float(row['longitude']),
            volume=int(row['volume']),
            cluster=int(row['cluster'])
        )
        for _, row in cluster_data.iterrows()
    ]
    
    # 3. Prediksi dana
    pred_data, pred_value = predict_funds(batches, months_ahead=1)
    prediction = [
        PredictionData(
            bulan=item['bulan'],
            total_value=float(item['total_value']),
            type=item['type']
        )
        for item in pred_data
    ]
    
    return AIResponse(
        recommendations=recommendations,
        clusters=clusters,
        prediction=prediction,
        prediction_next_value=float(pred_value)
    )

@app.get("/ai/refresh")
def refresh_data():
    """
    Generate ulang data dummy (untuk testing).
    """
    global depositors, collectors, batches
    depositors = generate_depositors(n=120)
    collectors = generate_collectors(n=8)
    batches = generate_batches(depositors, collectors, months=6)
    return {"status": "data regenerated"}