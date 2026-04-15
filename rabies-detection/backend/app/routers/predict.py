"""
/api/predict, /api/history, /api/predictions/{id}
"""

import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database_models import Prediction
from app.schemas.api_schemas import PredictRequest, PredictResponse, PredictionHistoryItem
from app.services.prediction_service import predict, get_model_info

router = APIRouter(prefix="/api", tags=["predictions"])


@router.post("/predict", response_model=PredictResponse)
def make_prediction(req: PredictRequest, db: Session = Depends(get_db)):
    data = req.model_dump()
    result = predict(data)

    record = Prediction(
        patient_name=result["patient_name"],
        input_data=json.dumps(data),
        result=json.dumps(result),
        risk_level=result["risk_level"],
        probability=result["final_probability"],
        created_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return PredictResponse(
        id=record.id,
        patient_name=result["patient_name"],
        risk_level=result["risk_level"],
        final_probability=result["final_probability"],
        symptom_boost=result["symptom_boost"],
        top_features=result["top_features"],
        recommendations=result["recommendations"],
        created_at=record.created_at,
    )


@router.get("/history", response_model=List[PredictionHistoryItem])
def get_history(db: Session = Depends(get_db)):
    records = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(15).all()
    return [
        PredictionHistoryItem(
            id=r.id,
            patient_name=r.patient_name,
            risk_level=r.risk_level,
            probability=r.probability,
            created_at=r.created_at,
        )
        for r in records
    ]


@router.get("/predictions/{prediction_id}", response_model=PredictResponse)
def get_prediction(prediction_id: int, db: Session = Depends(get_db)):
    record = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Prediction not found")

    result = json.loads(record.result)
    return PredictResponse(
        id=record.id,
        patient_name=result["patient_name"],
        risk_level=result["risk_level"],
        final_probability=result["final_probability"],
        symptom_boost=result["symptom_boost"],
        top_features=result["top_features"],
        recommendations=result["recommendations"],
        created_at=record.created_at,
    )


@router.get("/model-info")
def model_info():
    return get_model_info()
