"""
Train AI/ML Defect Prioritization Engine for Indian Railways Problem Statement 26027
Integrates TMS, SMMS, and TDMS Defect Repositories.

Predicts:
1. Maintenance Priority Index (MPI: 0 to 100) - Continuous Regression
2. Urgency Tier (CRITICAL_EMERGENCY, HIGH_PRIORITY, MEDIUM_PLANNED, ROUTINE_CYCLE) - Multi-class Classification
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def load_and_unify_defects():
    """Consolidate TMS, SMMS, and TDMS into a single multi-department work order pool."""
    df_tms = pd.read_csv(os.path.join(DATA_DIR, "tms_track_defects.csv"))
    df_smms = pd.read_csv(os.path.join(DATA_DIR, "smms_signal_defects.csv"))
    df_tdms = pd.read_csv(os.path.join(DATA_DIR, "tdms_traction_defects.csv"))

    # Standardize columns
    common_cols = [
        "defect_id", "department", "system_source", "station_code", "station_name",
        "chainage_km", "defect_category", "asset_age_years", "overdue_days",
        "estimated_repair_hours", "safety_risk_score", "target_mpi_score", "urgency_level"
    ]

    unified = pd.concat([
        df_tms[common_cols],
        df_smms[common_cols],
        df_tdms[common_cols]
    ], ignore_index=True)

    return unified

def train_prioritizer():
    print("=" * 70)
    print("AI-POWERED DEFECT PRIORITIZATION ENGINE (PS 26027)")
    print("=" * 70)

    df = load_and_unify_defects()
    print(f"[INFO] Loaded {len(df)} total defect work requests:")
    print(f"  - TMS (Track / Civil Engineering): {len(df[df['system_source'] == 'TMS'])}")
    print(f"  - SMMS (Signalling & Telecom S&T): {len(df[df['system_source'] == 'SMMS'])}")
    print(f"  - TDMS (Traction Distribution TRD): {len(df[df['system_source'] == 'TDMS'])}")

    # Features and Targets
    feature_cols = [
        "department", "defect_category", "asset_age_years", "overdue_days",
        "safety_risk_score", "estimated_repair_hours", "chainage_km"
    ]

    X_raw = df[feature_cols].copy()
    y_reg = df["target_mpi_score"].values
    y_cls_raw = df["urgency_level"].values

    # Encode categoricals
    le_urgency = LabelEncoder()
    y_cls = le_urgency.fit_transform(y_cls_raw)

    # One-hot encode department and defect category
    X = pd.get_dummies(X_raw, columns=["department", "defect_category"], drop_first=True)
    feature_names = list(X.columns)

    # Train / Test Split (80/20)
    X_train, X_test, y_reg_train, y_reg_test, y_cls_train, y_cls_test = train_test_split(
        X, y_reg, y_cls, test_size=0.20, random_state=42, stratify=y_cls
    )

    print(f"\n[INFO] Training Dataset: {len(X_train)} samples | Test Dataset: {len(X_test)} samples")

    # ------------------------------------------------------------------
    # 1. Train Regression Model (Predict MPI 0 - 100)
    # ------------------------------------------------------------------
    print("\n[STEP 1] Training Gradient Boosting Regressor for MPI Score...")
    reg_model = GradientBoostingRegressor(n_estimators=120, max_depth=4, learning_rate=0.08, random_state=42)
    reg_model.fit(X_train, y_reg_train)

    y_reg_pred = reg_model.predict(X_test)
    mae = mean_absolute_error(y_reg_test, y_reg_pred)
    r2 = r2_score(y_reg_test, y_reg_pred)
    print(f"  -> Regressor Performance: MAE = {mae:.2f} points | R² Score = {r2:.4f} (Accuracy: {r2*100:.1f}%)")

    # ------------------------------------------------------------------
    # 2. Train Classification Model (Predict Urgency Tier)
    # ------------------------------------------------------------------
    print("\n[STEP 2] Training Random Forest Classifier for Urgency Level...")
    cls_model = RandomForestClassifier(n_estimators=150, max_depth=6, random_state=42)
    cls_model.fit(X_train, y_cls_train)

    y_cls_pred = cls_model.predict(X_test)
    acc = accuracy_score(y_cls_test, y_cls_pred)
    print(f"  -> Classifier Accuracy: {acc*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_cls_test, y_cls_pred, target_names=le_urgency.classes_))

    # ------------------------------------------------------------------
    # 3. Feature Importance Analysis
    # ------------------------------------------------------------------
    print("\n[STEP 3] Top 5 Drivers of Maintenance Priority Index (MPI):")
    importances = reg_model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1][:5]
    for rank, idx in enumerate(sorted_idx, 1):
        print(f"  {rank}. {feature_names[idx]:<35}: {importances[idx]*100:.2f}% importance")

    # ------------------------------------------------------------------
    # 4. Predict on Full Dataset & Export Prioritized Work Orders
    # ------------------------------------------------------------------
    df["predicted_mpi_score"] = np.round(reg_model.predict(X), 1)
    df["predicted_urgency_level"] = le_urgency.inverse_transform(cls_model.predict(X))

    # Rank by Priority
    df_sorted = df.sort_values(by=["predicted_mpi_score", "safety_risk_score"], ascending=[False, False]).reset_index(drop=True)
    df_sorted["priority_rank"] = range(1, len(df_sorted) + 1)

    work_order_path = os.path.join(DATA_DIR, "prioritized_maintenance_work_orders.csv")
    df_sorted.to_csv(work_order_path, index=False)
    print(f"\n[SUCCESS] Exported {len(df_sorted)} ranked work orders to: {work_order_path}")

    # ------------------------------------------------------------------
    # 5. Save Trained Model Pipeline Artifacts
    # ------------------------------------------------------------------
    model_bundle = {
        "reg_model": reg_model,
        "cls_model": cls_model,
        "label_encoder": le_urgency,
        "feature_names": feature_names,
        "metrics": {"mae": mae, "r2": r2, "accuracy": acc}
    }
    model_path = os.path.join(MODELS_DIR, "defect_prioritizer_pipeline.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model_bundle, f)
    print(f"[SUCCESS] Saved production model pipeline to: {model_path}")

if __name__ == "__main__":
    train_prioritizer()
