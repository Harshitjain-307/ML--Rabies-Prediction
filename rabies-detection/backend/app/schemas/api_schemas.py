from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ── Request ────────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    patient_name: str = Field(..., example="John Doe")
    age: int = Field(..., ge=1, le=120, example=35)
    gender: str = Field(..., example="male")

    animal_bite: int = Field(..., ge=0, le=1, example=1)
    animal_type: str = Field(..., example="dog")
    bite_severity: str = Field(..., example="Severe")
    wound_location: str = Field(..., example="Head/Neck")
    days_since_bite: int = Field(..., ge=0, le=30, example=10)
    vaccination_status: int = Field(..., ge=0, le=1, example=0)
    wound_washed: int = Field(..., ge=0, le=1, example=0)
    pep_started: int = Field(..., ge=0, le=1, example=0)

    fever: int = Field(..., ge=0, le=1, example=1)
    tingling_at_wound: int = Field(..., ge=0, le=1, example=1)
    hydrophobia: int = Field(..., ge=0, le=1, example=1)
    confusion: int = Field(..., ge=0, le=1, example=1)
    muscle_spasms: int = Field(..., ge=0, le=1, example=0)
    paralysis: int = Field(..., ge=0, le=1, example=0)


# ── Sub-schemas ────────────────────────────────────────────────────────────────
class FeatureWeight(BaseModel):
    feature: str
    weight: float


# ── Response ───────────────────────────────────────────────────────────────────
class PredictResponse(BaseModel):
    id: int
    patient_name: str
    risk_level: str
    final_probability: float
    symptom_boost: float
    top_features: List[FeatureWeight]
    recommendations: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── History item ───────────────────────────────────────────────────────────────
class PredictionHistoryItem(BaseModel):
    id: int
    patient_name: str
    risk_level: str
    probability: float
    created_at: datetime

    class Config:
        from_attributes = True
