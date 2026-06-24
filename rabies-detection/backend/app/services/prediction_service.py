"""
ML Prediction Service — loads the trained XGBoost model and performs inference
with symptom boosting, feature importance extraction, and clinical recommendations.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

# ── Load model once at module import ──────────────────────────────────────────
MODEL_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), '..', '..', 'models', 'rabies_model.pkl')
)

_model_bundle = None


def _load_model():
    global _model_bundle
    if _model_bundle is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Train the model first.")
        _model_bundle = joblib.load(MODEL_PATH)
    return _model_bundle


# ── Symptom weights for boost calculation ─────────────────────────────────────
SYMPTOM_WEIGHTS = {
    'hydrophobia': 0.40,
    'tingling_at_wound': 0.15,
    'confusion': 0.12,
    'fever': 0.10,
    'muscle_spasms': 0.13,
    'paralysis': 0.10,
}


def calculate_symptom_boost(data: Dict[str, Any]) -> float:
    """Compute a weighted symptom contribution score."""
    boost = 0.0
    for symptom, weight in SYMPTOM_WEIGHTS.items():
        if data.get(symptom, 0) == 1:
            boost += weight
    return round(boost, 4)


# ── Risk level classification ─────────────────────────────────────────────────
def classify_risk(probability: float) -> str:
    if probability >= 0.70:
        return "High"
    elif probability >= 0.35:
        return "Medium"
    return "Low"


# ── Clinical recommendations ─────────────────────────────────────────────────
def generate_recommendations(risk_level: str, data: Dict[str, Any]) -> List[str]:
    recs: List[str] = []

    if risk_level == "High":
        recs.append("⚠️ IMMEDIATE: Administer Post-Exposure Prophylaxis (PEP) without delay.")
        recs.append("🏥 Rush patient to hospital for wound debridement and neurological evaluation.")
        recs.append("💉 Rabies immunoglobulin (RIG) should be infiltrated around the wound site.")
        recs.append("📋 Report bite incident to local health authority for animal surveillance.")
        if data.get('hydrophobia', 0):
            recs.append("🚨 CRITICAL: Hydrophobia detected — indicative of clinical rabies. Initiate Milwaukee Protocol evaluation.")
        if data.get('paralysis', 0):
            recs.append("⚡ Paralytic symptoms present — ICU admission recommended for supportive care.")

    elif risk_level == "Medium":
        recs.append("💉 Start rabies vaccination schedule (days 0, 3, 7, 14, 28).")
        recs.append("🩹 Thorough wound irrigation with soap and water for at least 15 minutes.")
        if data.get('pep_started', 0) == 0:
            recs.append("⚠️ PEP has not been initiated — consult infectious disease specialist.")
        recs.append("📋 Monitor patient for 10 days for onset of neurological symptoms.")
        recs.append("🔬 Consider sending animal for rabies testing if captured.")

    else:  # Low
        recs.append("🩹 Clean the wound thoroughly with soap and running water.")
        recs.append("👁️ Observe for any developing symptoms over the next 14 days.")
        recs.append("📋 Record the incident and schedule a follow-up in 48 hours.")
        if data.get('vaccination_status', 0) == 0:
            recs.append("💉 Consider pre-exposure vaccination if in a high-risk area.")

    return recs


# ── Feature importance extraction ─────────────────────────────────────────────
def get_top_features(bundle: Dict, n: int = 5) -> List[Dict[str, Any]]:
    """Return top N features from the trained model."""
    feat_imp = bundle.get('feature_importances', [])
    result = []
    for item in feat_imp[:n]:
        feature = item.get("feature", "unknown")
        weight = item.get("weight", 0)
        result.append({"feature": feature, "weight": round(float(weight), 4)})
    return result


# ── Main prediction function ──────────────────────────────────────────────────
def predict(data: Dict[str, Any]) -> Dict[str, Any]:
    bundle = _load_model()
    pipeline = bundle['model']
    num_cols = bundle['num_cols']
    cat_cols = bundle['cat_cols']

    # Build input DataFrame
    input_dict = {col: [data.get(col)] for col in num_cols + cat_cols}
    df = pd.DataFrame(input_dict)

    # Base risk score calculation aligned with generate_dataset.py
    if data.get('animal_bite', 0) == 0:
        probability = 0.0
        risk_level = "Low"
    else:
        score = -0.8
        animal_weights = {
            "dog": 0.80,
            "cat": 0.45,
            "monkey": 0.95,
            "bat": 1.15,
            "wild_animal": 1.10,
            "none": 0.0
        }
        score += animal_weights.get(data.get('animal_type', 'none'), 0.0)

        severity_weights = {
            "Mild": 0.30,
            "Moderate": 0.85,
            "Severe": 1.45,
            "None": 0.0
        }
        score += severity_weights.get(data.get('bite_severity', 'None'), 0.0)

        location_weights = {
            "Limb": 0.15,
            "Trunk": 0.45,
            "Head/Neck": 1.15,
            "None": 0.0
        }
        score += location_weights.get(data.get('wound_location', 'None'), 0.0)

        age = data.get('age', 30)
        if age <= 12:
            score += 0.25
        elif age >= 65:
            score += 0.18

        days = data.get('days_since_bite', 0)
        if days >= 21:
            score += 0.55
        elif days >= 11:
            score += 0.30
        elif days <= 2:
            score -= 0.08

        if data.get('wound_washed', 0) == 1:
            score -= 0.65
        if data.get('pep_started', 0) == 1:
            score -= 1.25
        if data.get('vaccination_status', 0) == 1:
            score -= 0.95

        symptom_boost_val = (
            1.10 * data.get('hydrophobia', 0)
            + 0.85 * data.get('confusion', 0)
            + 0.85 * data.get('muscle_spasms', 0)
            + 1.05 * data.get('paralysis', 0)
            + 0.15 * data.get('tingling_at_wound', 0)
            + 0.10 * data.get('fever', 0)
        )

        time_factor = 0.0
        if days >= 18:
            time_factor += 0.22
        elif days >= 10:
            time_factor += 0.10

        final_score = (score + symptom_boost_val + time_factor) * 2.5
        probability = 1.0 / (1.0 + np.exp(-final_score))
        
        # Apply pep and vaccination immunity override
        if data.get('pep_started', 0) == 1 and data.get('vaccination_status', 0) == 1:
            probability = 0.0

        if probability >= 0.70:
            risk_level = "High"
        elif probability >= 0.35:
            risk_level = "Medium"
        else:
            risk_level = "Low"

    symptom_boost = calculate_symptom_boost(data)
    top_features = get_top_features(bundle, n=5)
    recommendations = generate_recommendations(risk_level, data)

    return {
        "patient_name": data.get("patient_name", "Unknown"),
        "risk_level": risk_level,
        "final_probability": round(float(probability), 4),
        "symptom_boost": symptom_boost,
        "top_features": top_features,
        "recommendations": recommendations,
    }


def get_model_info() -> Dict[str, Any]:
    """Return model metadata for the dashboard."""
    try:
        bundle = _load_model()
        feat_imp = bundle.get("feature_importances", [])
        return {
            "accuracy": bundle.get("accuracy", 0),
            "auroc": bundle.get("auroc", 0),
            "confusion_matrix": bundle.get("confusion_matrix", []),
            "feature_importances": [
                {"feature": item.get("feature", "unknown"), "weight": round(float(item.get("weight", 0)), 4)}
                for item in feat_imp[:12]
            ],
        }
    except FileNotFoundError:
        return {"error": "Model not trained yet"}

