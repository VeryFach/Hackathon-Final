from pydantic import BaseModel
from typing import List, Optional

class Coordinate(BaseModel):
    latitude: float
    longitude: float

class ClusterRequest(BaseModel):
    coordinates: List[Coordinate]
    n_clusters: Optional[int] = None

class LocationRecommendation(BaseModel):
    latitude: float
    longitude: float
    cluster: int
    score: float
    nama: str

class ClusterPoint(BaseModel):
    depositorId: str
    latitude: float
    longitude: float
    volume: float
    cluster: int

class PredictionData(BaseModel):
    bulan: str
    total_value: float
    type: str
    volume_liter: Optional[float] = None
    price_per_liter: Optional[float] = None

class AIResponse(BaseModel):
    recommendations: List[LocationRecommendation]
    clusters: List[ClusterPoint]
    prediction: List[PredictionData]
    prediction_next_value: float
