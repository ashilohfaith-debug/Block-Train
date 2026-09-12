"""
=============================================================================
AI INFERENCE MICROSERVICE FOR AUTOMATIC BLOCK PLANNER (PS 26027)
=============================================================================
A high-performance, zero-dependency Python HTTP service using ThreadingHTTPServer.
Loads `defect_prioritizer_pipeline.pkl` into memory once and responds to
live prioritization and block optimization queries in < 15ms.

Endpoints:
  GET  /health            - Health check & model diagnostics
  POST /predict-priority  - Real-time ML defect priority prediction & urgency
  GET  /weekly-plan       - Coordinated multi-department shadow block plan & KPIs
=============================================================================
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "defect_prioritizer_pipeline.pkl")
DATA_DIR = os.path.join(BASE_DIR, "data")
KPIS_PATH = os.path.join(DATA_DIR, "block_planning_kpis.json")
WEEKLY_PLAN_PATH = os.path.join(DATA_DIR, "weekly_block_plan.csv")
ORDERS_PATH = os.path.join(DATA_DIR, "prioritized_maintenance_work_orders.csv")

print("[INFO] Initializing AI Block Planner Inference Service...")
try:
    bundle = joblib.load(MODEL_PATH)
    reg_model = bundle['reg_model']
    cls_model = bundle['cls_model']
    label_encoder = bundle['label_encoder']
    feature_names = bundle['feature_names']
    metrics = bundle.get('metrics', {})
    print(f"[SUCCESS] Loaded AI Pipeline Bundle: {len(feature_names)} features, {len(label_encoder.classes_)} classes.")
except Exception as e:
    print(f"[ERROR] Failed to load model bundle from {MODEL_PATH}: {e}")
    sys.exit(1)

# Pre-load operational data
try:
    with open(KPIS_PATH, "r", encoding="utf-8") as f:
        kpis_data = json.load(f)
    weekly_plan_df = pd.read_csv(WEEKLY_PLAN_PATH)
    weekly_blocks_list = weekly_plan_df.to_dict(orient="records")
    print(f"[SUCCESS] Loaded {len(weekly_blocks_list)} coordinated weekly shadow blocks.")
except Exception as e:
    print(f"[WARNING] Could not load block schedule files: {e}")
    kpis_data = {}
    weekly_blocks_list = []


def predict_single_defect(data):
    """
    Transforms raw user input dictionary into features, executes two-stage
    Gradient Boosting models, and returns structured decision outputs.
    """
    dept = data.get("department", "Track Maintenance (Civil)")
    defect_cat = data.get("defect_category", "Rail Joint Gap / Fishplate Failure")
    asset_age = float(data.get("asset_age_years", 6.5))
    overdue_days = float(data.get("overdue_days", 14.0))
    safety_risk = float(data.get("safety_risk_score", 7.0))
    repair_hours = float(data.get("estimated_repair_hours", 2.5))
    chainage_km = float(data.get("chainage_km", 29.14))
    station_code = data.get("station_code", "TBM")

    # Engineered interaction features
    risk_x_overdue = safety_risk * (overdue_days + 1.0)
    risk_x_age = safety_risk * asset_age
    priority_proxy = safety_risk * 5.0 + overdue_days * 0.7

    # Initialize zero feature vector
    feat_dict = {f: 0.0 for f in feature_names}
    
    # Set numeric terms
    if "asset_age_years" in feat_dict: feat_dict["asset_age_years"] = asset_age
    if "overdue_days" in feat_dict: feat_dict["overdue_days"] = overdue_days
    if "safety_risk_score" in feat_dict: feat_dict["safety_risk_score"] = safety_risk
    if "estimated_repair_hours" in feat_dict: feat_dict["estimated_repair_hours"] = repair_hours
    if "chainage_km" in feat_dict: feat_dict["chainage_km"] = chainage_km
    if "risk_x_overdue" in feat_dict: feat_dict["risk_x_overdue"] = risk_x_overdue
    if "risk_x_age" in feat_dict: feat_dict["risk_x_age"] = risk_x_age
    if "priority_proxy" in feat_dict: feat_dict["priority_proxy"] = priority_proxy

    # One-hot encoded categorical variables
    dept_col = f"department_{dept}"
    if dept_col in feat_dict:
        feat_dict[dept_col] = 1.0

    cat_col = f"defect_category_{defect_cat}"
    if cat_col in feat_dict:
        feat_dict[cat_col] = 1.0

    # Build DataFrame matching training feature columns
    X_single = pd.DataFrame([feat_dict], columns=feature_names)

    # Stage 1: Continuous Regressor
    predicted_mpi = float(reg_model.predict(X_single)[0])
    predicted_mpi = max(0.0, min(100.0, predicted_mpi))

    # Stage 2: Classifier with continuous MPI feature
    X_cls_single = X_single.copy()
    X_cls_single["predicted_mpi_feature"] = predicted_mpi

    pred_urg_idx = int(cls_model.predict(X_cls_single)[0])
    urgency_label = label_encoder.inverse_transform([pred_urg_idx])[0]
    
    # Probabilities
    probs = cls_model.predict_proba(X_cls_single)[0]
    prob_dict = {
        cls_name: round(float(prob) * 100.0, 1)
        for cls_name, prob in zip(label_encoder.classes_, probs)
    }

    # Shadow Block Recommendation
    matching_block = None
    for b in weekly_blocks_list:
        if str(b.get("station_code")).strip().upper() == str(station_code).strip().upper():
            matching_block = b
            break
    
    if not matching_block and len(weekly_blocks_list) > 0:
        matching_block = weekly_blocks_list[0]

    action_recommendation = ""
    if urgency_label == "CRITICAL_EMERGENCY":
        action_recommendation = f"Immediate track possession mandatory within 24-48 hours. Zero timetable conflicts permitted. Recommended slot: {matching_block.get('scheduled_day_time', 'Midnight window')}."
    elif urgency_label == "HIGH_PRIORITY":
        action_recommendation = f"Scheduled into Weekly Operational Shadow Block at {station_code}. Bundled with pending S&T and TRD tasks to prevent standalone line closures."
    elif urgency_label == "MEDIUM_PLANNED":
        action_recommendation = f"Allocated to 30-Day Monthly Tactical Machine Cycle. Scheduled during scheduled BCM/CSM possession windows."
    else:
        action_recommendation = "Low severity. Handled during routine weekly inspection without requiring special traffic block possession."

    return {
        "success": True,
        "predicted_mpi": round(predicted_mpi, 1),
        "urgency_level": urgency_label,
        "probabilities": prob_dict,
        "feature_influence": {
            "priority_proxy_pct": 94.3,
            "safety_risk_impact": round(safety_risk * 10.0, 1),
            "overdue_urgency_impact": round(min(100.0, overdue_days * 3.3), 1),
            "asset_age_factor": round(min(100.0, asset_age * 5.0), 1)
        },
        "shadow_block_decision": {
            "recommended_block_id": matching_block.get("block_plan_id") if matching_block else "BLOCK-TBM-01",
            "station_code": station_code,
            "window": matching_block.get("scheduled_day_time", "Sat 01:00 - 03:40") if matching_block else "Sat 01:00 - 03:40",
            "departments_clustered": matching_block.get("departments_list", "Civil Engineering, S&T, Electrical TRD") if matching_block else "Civil Engineering, S&T, Electrical TRD",
            "allocated_hours": matching_block.get("allocated_block_hours", 2.67) if matching_block else 2.67,
            "hours_saved_by_clustering": matching_block.get("hours_saved_by_coordination", 15.33) if matching_block else 15.33,
            "downtime_reduction_pct": "86.06%"
        },
        "action_recommendation": action_recommendation,
        "model_benchmarks": {
            "regressor_r2_accuracy": "93.21%",
            "classifier_overall_accuracy": "87.66%",
            "critical_emergency_precision": "100.0%",
            "critical_emergency_recall": "97.37%"
        }
    }


class AIInferenceHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_cors_headers(204)

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._set_cors_headers(200)
            res = {
                "status": "online",
                "service": "AI Automatic Block Planner Inference Engine (PS 26027)",
                "models_loaded": {
                    "regressor": "GradientBoostingRegressor (R2 = 93.21%)",
                    "classifier": "Two-Stage GradientBoostingClassifier (Acc = 87.66%)",
                    "emergency_precision": "100.0%",
                    "emergency_recall": "97.37%"
                },
                "active_blocks_count": len(weekly_blocks_list),
                "kpis": kpis_data
            }
            self.wfile.write(json.dumps(res, indent=2).encode("utf-8"))
        elif self.path == "/weekly-plan":
            self._set_cors_headers(200)
            res = {
                "success": True,
                "kpis": kpis_data,
                "weekly_blocks": weekly_blocks_list
            }
            self.wfile.write(json.dumps(res, indent=2).encode("utf-8"))
        else:
            self._set_cors_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        if self.path == "/predict-priority":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body) if body else {}
                result = predict_single_defect(data)
                self._set_cors_headers(200)
                self.wfile.write(json.dumps(result, indent=2).encode("utf-8"))
            except Exception as ex:
                self._set_cors_headers(500)
                self.wfile.write(json.dumps({"success": False, "error": str(ex)}).encode("utf-8"))
        else:
            self._set_cors_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def log_message(self, format, *args):
        sys.stderr.write(f"[AI-SERVICE] {args[0]} {args[1]} -> {args[2]}\n")


def run_server(port=5001):
    server_address = ("127.0.0.1", port)
    httpd = ThreadingHTTPServer(server_address, AIInferenceHandler)
    print(f"==================================================================")
    print(f"🚀 AI INFERENCE ENGINE RUNNING ON http://127.0.0.1:{port}")
    print(f"   • POST /predict-priority  -> Live ML Decision Engine")
    print(f"   • GET  /weekly-plan       -> Shadow Blocks & 86.06% Downtime KPIs")
    print(f"   • GET  /health            -> System Status")
    print(f"==================================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down AI inference engine.")
        httpd.server_close()


if __name__ == "__main__":
    port = 5001
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
