"""
Prediction routes:
- POST /api/predict
- GET /api/history
- GET /api/predictions/{id}
- GET /api/model-info
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from json import JSONDecodeError
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database_models import Prediction
from app.schemas.api_schemas import (
    PredictRequest,
    PredictResponse,
    PredictionHistoryItem,
)
from app.services.prediction_service import get_model_info, predict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["predictions"])


# ----------------------------
# Helper functions
# ----------------------------

REQUIRED_RESULT_KEYS = {
    "patient_name",
    "risk_level",
    "final_probability",
    "symptom_boost",
    "top_features",
    "recommendations",
}


def utc_now_naive() -> datetime:
    """
    Return current UTC time as naive datetime.
    Useful when DB column is naive DateTime.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


def validate_prediction_result(result: Dict[str, Any]) -> None:
    """
    Ensure prediction service returns all required keys.
    Raises HTTPException if result is malformed.
    """
    missing_keys = [key for key in REQUIRED_RESULT_KEYS if key not in result]
    if missing_keys:
        logger.error("Prediction result missing keys: %s", missing_keys)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction service returned incomplete data: {', '.join(missing_keys)}",
        )


def safe_json_dumps(data: Any) -> str:
    """
    JSON serialization with consistent formatting.
    """
    return json.dumps(data, default=str, ensure_ascii=False)


def safe_json_loads(raw_value: str, field_name: str = "json") -> Dict[str, Any]:
    """
    Safely parse stored JSON data.
    """
    try:
        parsed = json.loads(raw_value)
        if not isinstance(parsed, dict):
            raise ValueError(f"{field_name} is not a JSON object")
        return parsed
    except (JSONDecodeError, ValueError, TypeError) as exc:
        logger.exception("Failed to parse stored %s: %s", field_name, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stored prediction {field_name} is corrupted",
        ) from exc


def build_predict_response(record: Prediction, result: Dict[str, Any]) -> PredictResponse:
    """
    Convert DB record + stored result into API response schema.
    """
    return PredictResponse(
        id=record.id,
        patient_name=result.get("patient_name", record.patient_name),
        risk_level=result.get("risk_level", record.risk_level),
        final_probability=float(result.get("final_probability", record.probability or 0.0)),
        symptom_boost=result.get("symptom_boost", 0.0),
        top_features=result.get("top_features", []),
        recommendations=result.get("recommendations", []),
        created_at=record.created_at,
    )


# ----------------------------
# Routes
# ----------------------------

@router.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_201_CREATED,
)
def make_prediction(req: PredictRequest, db: Session = Depends(get_db)) -> PredictResponse:
    """
    Run prediction, store it in DB, and return structured response.
    """
    data = req.model_dump()

    try:
        result = predict(data)
        if not isinstance(result, dict):
            logger.error("Prediction service returned non-dict result: %r", result)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Prediction service returned invalid response",
            )

        validate_prediction_result(result)

        patient_name = str(result.get("patient_name") or data.get("patient_name") or "Unknown")
        risk_level = str(result.get("risk_level") or "Unknown")
        final_probability = float(result.get("final_probability") or 0.0)

        record = Prediction(
            patient_name=patient_name,
            input_data=safe_json_dumps(data),
            result=safe_json_dumps(result),
            risk_level=risk_level,
            probability=final_probability,
            created_at=utc_now_naive(),
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return build_predict_response(record, result)

    except HTTPException:
        db.rollback()
        raise
    except ValueError as exc:
        db.rollback()
        logger.exception("Validation error during prediction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Database error while saving prediction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while saving prediction",
        ) from exc
    except Exception as exc:
        db.rollback()
        logger.exception("Unexpected error during prediction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal server error",
        ) from exc


@router.get("/history", response_model=List[PredictionHistoryItem])
def get_history(db: Session = Depends(get_db)) -> List[PredictionHistoryItem]:
    """
    Return recent prediction history for dashboard/history page.
    """
    try:
        records = (
            db.query(Prediction)
            .order_by(Prediction.created_at.desc(), Prediction.id.desc())
            .limit(15)
            .all()
        )

        return [
            PredictionHistoryItem(
                id=record.id,
                patient_name=record.patient_name,
                risk_level=record.risk_level,
                probability=float(record.probability or 0.0),
                created_at=record.created_at,
            )
            for record in records
        ]
    except SQLAlchemyError as exc:
        logger.exception("Database error while fetching history: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch prediction history",
        ) from exc


@router.get("/predictions/{prediction_id}", response_model=PredictResponse)
def get_prediction(prediction_id: int, db: Session = Depends(get_db)) -> PredictResponse:
    """
    Return a single stored prediction by ID.
    """
    try:
        record = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    except SQLAlchemyError as exc:
        logger.exception("Database error while fetching prediction %s: %s", prediction_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch prediction",
        ) from exc

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction not found",
        )

    result = safe_json_loads(record.result, field_name="result")
    return build_predict_response(record, result)


@router.get("/model-info")
def model_info() -> Dict[str, Any]:
    """
    Return model metadata for dashboard screen.
    """
    try:
        info = get_model_info()
        if not isinstance(info, dict):
            logger.error("Model info service returned non-dict response: %r", info)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Model info is not available",
            )
        return info
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch model info: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load model info",
        ) from exc
    