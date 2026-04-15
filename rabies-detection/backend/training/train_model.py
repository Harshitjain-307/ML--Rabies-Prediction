"""
XGBoost Rabies Risk Classifier — Training Script
Target accuracy: >= 93% on held-out test set
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import (
    accuracy_score, classification_report, roc_auc_score,
    confusion_matrix
)
from xgboost import XGBClassifier

# Allow running from any working directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.normpath(os.path.join(SCRIPT_DIR, '..', 'data', 'processed', 'rabies_v3.csv'))
MODEL_PATH = os.path.normpath(os.path.join(SCRIPT_DIR, '..', 'models', 'rabies_model.pkl'))


def train():
    # ── Load dataset ──────────────────────────────────────────────────────────
    if not os.path.exists(DATA_PATH):
        print(f"Dataset not found at {DATA_PATH}. Run generate_dataset.py first.")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {df.shape[0]} records, {df.shape[1]} columns")

    # ── Feature definitions ───────────────────────────────────────────────────
    numerical_cols = [
        'age', 'animal_bite', 'vaccination_status', 'days_since_bite',
        'fever', 'wound_washed', 'pep_started', 'tingling_at_wound',
        'hydrophobia', 'confusion', 'muscle_spasms', 'paralysis'
    ]
    categorical_cols = ['gender', 'bite_severity', 'wound_location', 'animal_type']
    feature_cols = numerical_cols + categorical_cols

    X = df[feature_cols]
    y = df['target']

    # ── Train / test split ────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")

    # ── Preprocessing pipeline ────────────────────────────────────────────────
    numeric_transformer = RobustScaler()
    categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse_output=False)

    preprocessor = ColumnTransformer(transformers=[
        ('num', numeric_transformer, numerical_cols),
        ('cat', categorical_transformer, categorical_cols)
    ])

    # ── XGBoost classifier ────────────────────────────────────────────────────
    clf = XGBClassifier(
        n_estimators=300,
        learning_rate=0.05,
        max_depth=5,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42,
        n_jobs=-1
    )

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', clf)
    ])

    # ── Fit ───────────────────────────────────────────────────────────────────
    print("\nTraining XGBoost pipeline …")
    pipeline.fit(X_train, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    auroc = roc_auc_score(y_test, y_prob)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\n{'='*50}")
    print(f"  Accuracy : {accuracy*100:.2f}%")
    print(f"  AUROC    : {auroc:.4f}")
    print(f"{'='*50}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'High Risk']))
    print("Confusion Matrix (TN FP / FN TP):")
    print(f"  TN={cm[0,0]}  FP={cm[0,1]}")
    print(f"  FN={cm[1,0]}  TP={cm[1,1]}")
    print(f"{'='*50}")

    if accuracy < 0.93:
        print(f"\n⚠️  Accuracy {accuracy*100:.2f}% is below the 93% target. Review the dataset or hyperparameters.")
    else:
        print(f"\n✅ Model meets the ≥93% accuracy target!")

    # ── Feature importances ───────────────────────────────────────────────────
    ohe = pipeline.named_steps['preprocessor'].named_transformers_['cat']
    ohe_feature_names = ohe.get_feature_names_out(categorical_cols).tolist()
    all_feature_names = numerical_cols + ohe_feature_names

    importances = pipeline.named_steps['classifier'].feature_importances_
    feat_imp = sorted(
        zip(all_feature_names, importances),
        key=lambda x: x[1], reverse=True
    )
    print("\nTop 10 Feature Importances:")
    for fname, fimp in feat_imp[:10]:
        print(f"  {fname:<35} {fimp:.4f}")

    # ── Save model + metadata ─────────────────────────────────────────────────
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    model_bundle = {
        'model': pipeline,
        'num_cols': numerical_cols,
        'cat_cols': categorical_cols,
        'feature_names': all_feature_names,
        'accuracy': float(accuracy),
        'auroc': float(auroc),
        'confusion_matrix': cm.tolist(),
        'feature_importances': feat_imp
    }
    joblib.dump(model_bundle, MODEL_PATH)
    print(f"\n✅ Model saved to: {MODEL_PATH}")

    return model_bundle


if __name__ == '__main__':
    train()
