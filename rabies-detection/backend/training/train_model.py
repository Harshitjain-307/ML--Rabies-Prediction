"""
XGBoost Rabies Risk Classifier — Training Script

This script:
- loads processed rabies dataset
- validates schema
- trains a preprocessing + XGBoost pipeline
- evaluates on held-out test data
- saves model + metadata bundle for inference/dashboard use
"""

from __future__ import annotations

import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, RobustScaler
from xgboost import XGBClassifier


RANDOM_STATE = 15
TARGET_COLUMN = "target"

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_PATH = (SCRIPT_DIR / ".." / "data" / "processed" / "rabies_v3.csv").resolve()
MODEL_PATH = (SCRIPT_DIR / ".." / "models" / "rabies_model.pkl").resolve()

NUMERICAL_COLS = [
    "age",
    "animal_bite",
    "vaccination_status",
    "days_since_bite",
    "fever",
    "wound_washed",
    "pep_started",
    "tingling_at_wound",
    "hydrophobia",
    "confusion",
    "muscle_spasms",
    "paralysis",
]

CATEGORICAL_COLS = [
    "gender",
    "bite_severity",
    "wound_location",
    "animal_type",
]

FEATURE_COLS = NUMERICAL_COLS + CATEGORICAL_COLS


def set_global_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)


def build_one_hot_encoder() -> OneHotEncoder:
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


def validate_dataset(df: pd.DataFrame) -> None:
    missing_columns = [col for col in FEATURE_COLS + [TARGET_COLUMN] if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")

    if df.empty:
        raise ValueError("Dataset is empty.")

    target_values = set(df[TARGET_COLUMN].dropna().unique().tolist())
    if not target_values.issubset({0, 1}):
        raise ValueError(
            f"Target column must contain only binary values 0/1. Found: {sorted(target_values)}"
        )

    if len(target_values) < 2:
        raise ValueError("Target column must contain both 0 and 1 classes.")


def prepare_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    X = df[FEATURE_COLS].copy()
    y = df[TARGET_COLUMN].astype(int).copy()

    for col in NUMERICAL_COLS:
        X[col] = pd.to_numeric(X[col], errors="coerce")

    for col in CATEGORICAL_COLS:
        X[col] = X[col].astype(object).fillna("None")

    return X, y



def build_pipeline(scale_pos_weight: float) -> Pipeline:
    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", RobustScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", build_one_hot_encoder()),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, NUMERICAL_COLS),
            ("cat", categorical_pipeline, CATEGORICAL_COLS),
        ]
    )

    classifier = XGBClassifier(
        n_estimators=400,
        learning_rate=0.04,
        max_depth=5,
        min_child_weight=2,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_alpha=0.1,
        reg_lambda=1.2,
        gamma=0.1,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        scale_pos_weight=scale_pos_weight,
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )


def compute_scale_pos_weight(y: pd.Series) -> float:
    positive_count = int((y == 1).sum())
    negative_count = int((y == 0).sum())

    if positive_count == 0:
        return 1.0

    return max(negative_count / positive_count, 1.0)


def extract_feature_importances(pipeline: Pipeline) -> List[Dict[str, float]]:
    preprocessor: ColumnTransformer = pipeline.named_steps["preprocessor"]
    classifier: XGBClassifier = pipeline.named_steps["classifier"]

    encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
    categorical_feature_names = encoder.get_feature_names_out(CATEGORICAL_COLS).tolist()
    all_feature_names = NUMERICAL_COLS + categorical_feature_names

    raw_importances = classifier.feature_importances_
    feature_importances = [
        {"feature": feature_name, "weight": float(weight)}
        for feature_name, weight in zip(all_feature_names, raw_importances)
    ]
    feature_importances.sort(key=lambda item: item["weight"], reverse=True)

    total_weight = sum(item["weight"] for item in feature_importances)
    if total_weight > 0:
        for item in feature_importances:
            item["weight"] = item["weight"] / total_weight

    return feature_importances


def print_evaluation(
    accuracy: float,
    auroc: float,
    precision: float,
    recall: float,
    f1: float,
    cm: np.ndarray,
    y_test: pd.Series,
    y_pred: np.ndarray,
) -> None:
    print(f"\n{'=' * 60}")
    print("Rabies Risk Model Evaluation")
    print(f"{'=' * 60}")
    print(f"Accuracy  : {accuracy * 100:.2f}%")
    print(f"AUROC     : {auroc:.4f}")
    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1 Score  : {f1:.4f}")
    print(f"{'=' * 60}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "High Risk"]))

    print("Confusion Matrix (TN FP / FN TP):")
    print(f"TN={cm[0, 0]}  FP={cm[0, 1]}")
    print(f"FN={cm[1, 0]}  TP={cm[1, 1]}")
    print(f"{'=' * 60}")

    if accuracy < 0.93:
        print(
            f"\nWarning: Accuracy {accuracy * 100:.2f}% is below the 93% target. "
            "Review dataset quality, class balance, and hyperparameters."
        )
    else:
        print("\nSuccess: Model meets the >=93% accuracy target.")


def save_model_bundle(model_bundle: Dict[str, Any], model_path: Path) -> None:
    model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_bundle, model_path)
    print(f"\nModel saved to: {model_path}")


def train() -> Dict[str, Any]:
    set_global_seed(RANDOM_STATE)

    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found at {DATA_PATH}. Run generate_dataset.py first."
        )

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {df.shape[0]} records, {df.shape[1]} columns")

    validate_dataset(df)
    X, y = prepare_features(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

    scale_pos_weight = compute_scale_pos_weight(y_train)
    pipeline = build_pipeline(scale_pos_weight=scale_pos_weight)

    print("\nTraining XGBoost pipeline...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    accuracy = float(accuracy_score(y_test, y_pred))
    auroc = float(roc_auc_score(y_test, y_prob))
    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred)

    print_evaluation(
        accuracy=accuracy,
        auroc=auroc,
        precision=precision,
        recall=recall,
        f1=f1,
        cm=cm,
        y_test=y_test,
        y_pred=y_pred,
    )

    feature_importances = extract_feature_importances(pipeline)

    print("\nTop 10 Feature Importances:")
    for item in feature_importances[:10]:
        print(f"{item['feature']:<35} {item['weight']:.4f}")

    class_distribution = {
        "low_risk_count": int((y == 0).sum()),
        "high_risk_count": int((y == 1).sum()),
    }

    model_bundle: Dict[str, Any] = {
        "model": pipeline,
        "model_name": "XGBoost Rabies Risk Classifier",
        "problem_type": "binary_classification",
        "target_column": TARGET_COLUMN,
        "num_cols": NUMERICAL_COLS,
        "cat_cols": CATEGORICAL_COLS,
        "feature_columns": FEATURE_COLS,
        "training_rows": int(len(df)),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "class_distribution": class_distribution,
        "accuracy": accuracy,
        "auroc": auroc,
        "precision": precision,
        "recall": recall,
        "f1_score": f1,
        "confusion_matrix": cm.tolist(),
        "feature_importances": feature_importances,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "data_path": str(DATA_PATH),
    }

    save_model_bundle(model_bundle, MODEL_PATH)

    metadata_path = MODEL_PATH.with_suffix(".metadata.json")
    metadata_to_save = {key: value for key, value in model_bundle.items() if key != "model"}
    metadata_path.write_text(json.dumps(metadata_to_save, indent=2), encoding="utf-8")
    print(f"Metadata saved to: {metadata_path}")

    return model_bundle


if __name__ == "__main__":
    import traceback
    try:
        train()
    except Exception as exc:
        print(f"\nTraining failed: {exc}")
        traceback.print_exc()
        sys.exit(1)