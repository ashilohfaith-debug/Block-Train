#!/usr/bin/env python3
"""
Simulate Railway Network Data: 26-Station Corridor (A to Z)
Generates Station Master, 5 Child Restricting Tables (Signals, Gates, 3 Maint Types),
Accident Incidents (~3/day), and 8 Simulation Scenarios for Google Colab.
"""

import os
import random
import datetime
import pandas as pd
import numpy as np

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ----------------------------------------------------------------------
# 1. GENERATE 26-STATION MASTER TABLE
# Baseline travel time from Station A to Station Z: ~120 minutes (2 hours)
# 4 Junctions: Egmore (STA_D), Guindy (STA_J), St. Thomas Mount (STA_K), Tambaram (STA_R)
# ----------------------------------------------------------------------
STATION_DATA = [
    ("STA_A", "Station A (Chennai Beach)", False, 0.0, 0.0),
    ("STA_B", "Station B (Chennai Fort)", False, 1.8, 3.5),
    ("STA_C", "Station C (Chennai Park)", False, 1.2, 2.5),
    ("STA_D", "Station D (Chennai Egmore)", True, 2.1, 4.5),       # Junction 1 (60s dwell)
    ("STA_E", "Station E (Chetpet)", False, 1.6, 3.2),
    ("STA_F", "Station F (Nungambakkam)", False, 1.9, 3.8),
    ("STA_G", "Station G (Kodambakkam)", False, 1.4, 2.8),
    ("STA_H", "Station H (Mambalam)", False, 1.7, 3.5),
    ("STA_I", "Station I (Saidapet)", False, 2.0, 4.0),
    ("STA_J", "Station J (Guindy)", True, 2.4, 5.0),               # Junction 2 (60s dwell)
    ("STA_K", "Station K (St. Thomas Mount)", True, 2.2, 4.8),     # Junction 3 (60s dwell)
    ("STA_L", "Station L (Pazhavanthangal)", False, 1.5, 3.0),
    ("STA_M", "Station M (Meenambakkam)", False, 1.3, 2.6),
    ("STA_N", "Station N (Tirusulam)", False, 1.2, 2.4),
    ("STA_O", "Station O (Pallavaram)", False, 2.5, 5.2),
    ("STA_P", "Station P (Chromepet)", False, 2.3, 4.8),
    ("STA_Q", "Station Q (Tambaram Sanatorium)", False, 1.9, 3.9),
    ("STA_R", "Station R (Tambaram)", True, 3.1, 6.5),             # Junction 4 (60s dwell)
    ("STA_S", "Station S (Perungalathur)", False, 3.2, 6.0),
    ("STA_T", "Station T (Vandalur)", False, 2.8, 5.5),
    ("STA_U", "Station U (Urapakkam)", False, 3.5, 6.8),
    ("STA_V", "Station V (Guduvancheri)", False, 3.0, 5.8),
    ("STA_W", "Station W (Potheri)", False, 2.7, 5.2),
    ("STA_X", "Station X (Kattangulathur)", False, 2.1, 4.2),
    ("STA_Y", "Station Y (Maraimalai Nagar)", False, 3.4, 6.5),
    ("STA_Z", "Station Z (Chengalpattu)", False, 5.2, 9.0),
]

stations = []
cum_dist = 0.0
cum_time = 0.0

for idx, (code, name, is_junc, dist, run_time) in enumerate(STATION_DATA, start=1):
    cum_dist += dist
    dwell_sec = 60 if is_junc else 30
    dwell_min = dwell_sec / 60.0
    
    if idx == 1:
        scheduled_arrival = 0.0
        scheduled_departure = dwell_min
    else:
        cum_time += run_time
        scheduled_arrival = cum_time
        cum_time += dwell_min
        scheduled_departure = cum_time

    stations.append({
        "station_id": idx,
        "station_code": code,
        "station_name": name,
        "is_junction": is_junc,
        "dwell_time_seconds": dwell_sec,
        "inter_station_distance_km": dist,
        "distance_from_origin_km": round(cum_dist, 2),
        "baseline_segment_minutes": run_time,
        "baseline_scheduled_arrival_mins": round(scheduled_arrival, 2),
        "baseline_scheduled_departure_mins": round(scheduled_departure, 2),
    })

df_stations = pd.DataFrame(stations)
print(f"Total Stations: {len(df_stations)}")
print(f"Total Baseline Travel Time (A to Z): {df_stations['baseline_scheduled_arrival_mins'].iloc[-1]:.2f} minutes (~2 hours)")

# ----------------------------------------------------------------------
# 2. GENERATE RESTRICTING VARIABLE CHILD TABLES (24-Hour Period)
# Base Date: 2026-09-15 00:00:00
# ----------------------------------------------------------------------
BASE_DATE = datetime.datetime(2026, 9, 15, 0, 0, 0)

# 2.1 Signals Events (~48 events per day)
# Simulates signal holds/cautions causing 1 to 3 minutes delay
signals = []
for i in range(1, 49):
    hour = (i - 1) * (24 / 48)  # Distributed every ~30 mins
    minute = random.randint(0, 25)
    sec = random.randint(0, 59)
    event_time = BASE_DATE + datetime.timedelta(hours=hour, minutes=minute, seconds=sec)
    st_id = random.randint(1, 25)
    aspect = random.choice(["RED", "YELLOW", "DOUBLE_YELLOW"])
    delay_sec = random.randint(60, 180) if aspect == "RED" else random.randint(30, 90)
    signals.append({
        "event_id": i,
        "station_id": st_id,
        "station_code": df_stations.loc[df_stations["station_id"] == st_id, "station_code"].values[0],
        "event_timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S"),
        "signal_aspect": aspect,
        "delay_seconds": delay_sec,
        "delay_minutes": round(delay_sec / 60.0, 2)
    })
df_signals = pd.DataFrame(signals)

# 2.2 Gate Openings (~72 openings per day across level crossings)
# Simulates LC gates opened for road traffic (4 to 8 minutes each)
gates = []
GATE_LOCATIONS = [
    ("LC-01", 3, 4),   # Park - Egmore
    ("LC-02", 7, 8),   # Kodambakkam - Mambalam
    ("LC-03", 11, 12), # St. Thomas Mount - Pazhavanthangal
    ("LC-04", 15, 16), # Pallavaram - Chromepet
    ("LC-05", 19, 20), # Perungalathur - Vandalur
    ("LC-06", 21, 22), # Urapakkam - Guduvancheri
]

for i in range(1, 73):
    hour = (i - 1) * (24 / 72)
    minute = random.randint(0, 15)
    sec = random.randint(0, 59)
    open_time = BASE_DATE + datetime.timedelta(hours=hour, minutes=minute, seconds=sec)
    duration_sec = random.randint(240, 480) # 4 to 8 minutes
    close_time = open_time + datetime.timedelta(seconds=duration_sec)
    gate_code, st_from, st_to = random.choice(GATE_LOCATIONS)
    
    gates.append({
        "opening_id": i,
        "gate_code": gate_code,
        "between_station_from": st_from,
        "between_station_to": st_to,
        "station_pair": f"{df_stations.loc[st_from-1, 'station_code']} - {df_stations.loc[st_to-1, 'station_code']}",
        "open_timestamp": open_time.strftime("%Y-%m-%d %H:%M:%S"),
        "close_timestamp": close_time.strftime("%Y-%m-%d %H:%M:%S"),
        "open_duration_seconds": duration_sec,
        "delay_impact_minutes": round(duration_sec / 60.0, 2)
    })
df_gates = pd.DataFrame(gates)

# 2.3 Track Maintenance (Civil / P-Way)
track_maint = [
    {
        "block_id": 1,
        "station_id": 16, # Chromepet
        "station_code": "STA_P",
        "work_type": "PLAIN_TRACK_TAMPING",
        "start_time": (BASE_DATE + datetime.timedelta(hours=1, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=3, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 120,
        "speed_restriction_kmh": 30
    },
    {
        "block_id": 2,
        "station_id": 21, # Urapakkam
        "work_type": "BALLAST_CLEANING",
        "station_code": "STA_U",
        "start_time": (BASE_DATE + datetime.timedelta(hours=11, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=13, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 120,
        "speed_restriction_kmh": 20
    }
]
df_track_maint = pd.DataFrame(track_maint)

# 2.4 Engineering Maintenance (Structural / Turnouts)
engg_maint = [
    {
        "block_id": 1,
        "station_id": 8, # Mambalam
        "station_code": "STA_H",
        "work_type": "TURNOUT_SWITCH_OVERHAUL",
        "start_time": (BASE_DATE + datetime.timedelta(hours=2, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=3, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 90
    },
    {
        "block_id": 2,
        "station_id": 18, # Tambaram
        "station_code": "STA_R",
        "work_type": "FOOT_OVER_BRIDGE_GIRDER_INSPECTION",
        "start_time": (BASE_DATE + datetime.timedelta(hours=12, minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=13, minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 90
    }
]
df_engg_maint = pd.DataFrame(engg_maint)

# 2.5 Traction Maintenance (OHE Electrical Power Block)
traction_maint = [
    {
        "block_id": 1,
        "station_id": 10, # Guindy
        "station_code": "STA_J",
        "work_type": "OHE_CONTACT_WIRE_ADJUSTMENT",
        "start_time": (BASE_DATE + datetime.timedelta(hours=1, minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=3, minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 120,
        "power_block_de_energized": True
    },
    {
        "block_id": 2,
        "station_id": 17, # Tambaram Sanatorium
        "station_code": "STA_Q",
        "work_type": "CATENARY_INSULATOR_WASHING",
        "start_time": (BASE_DATE + datetime.timedelta(hours=13, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=15, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 90,
        "power_block_de_energized": True
    }
]
df_traction_maint = pd.DataFrame(traction_maint)

# 2.6 Accident / Emergency Events (~3 accidents per day simulated randomly)
# Example: random number = 63 corresponds to track point 63
accidents = [
    {
        "accident_id": 1,
        "incident_timestamp": (BASE_DATE + datetime.timedelta(hours=7, minutes=18)).strftime("%Y-%m-%d %H:%M:%S"),
        "track_point_marker": 63, # Point 63 as specified in prompt
        "nearest_station_id": 9,  # Saidapet
        "station_code": "STA_I",
        "severity_level": "CRITICAL",
        "alarm_triggered": True,
        "traction_dispatched": True,
        "signaling_dispatched": True,
        "engineering_dispatched": True,
        "estimated_clearing_delay_minutes": 35.0
    },
    {
        "accident_id": 2,
        "incident_timestamp": (BASE_DATE + datetime.timedelta(hours=14, minutes=42)).strftime("%Y-%m-%d %H:%M:%S"),
        "track_point_marker": 118,
        "nearest_station_id": 18, # Tambaram
        "station_code": "STA_R",
        "severity_level": "CRITICAL",
        "alarm_triggered": True,
        "traction_dispatched": True,
        "signaling_dispatched": True,
        "engineering_dispatched": True,
        "estimated_clearing_delay_minutes": 45.0
    },
    {
        "accident_id": 3,
        "incident_timestamp": (BASE_DATE + datetime.timedelta(hours=20, minutes=10)).strftime("%Y-%m-%d %H:%M:%S"),
        "track_point_marker": 41,
        "nearest_station_id": 6,  # Nungambakkam
        "station_code": "STA_F",
        "severity_level": "HIGH",
        "alarm_triggered": True,
        "traction_dispatched": True,
        "signaling_dispatched": True,
        "engineering_dispatched": True,
        "estimated_clearing_delay_minutes": 25.0
    }
]
df_accidents = pd.DataFrame(accidents)

# ----------------------------------------------------------------------
# 3. GENERATE 8 SIMULATION SCENARIOS (For ML Training & Validation)
# Scenarios 1-5: Training set
# Scenarios 6-8: Validation set
# ----------------------------------------------------------------------
SCENARIO_CONFIGS = [
    {"id": 1, "name": "Early Morning Clean Run", "start_hour": 5, "disruption_level": "LOW", "has_accident": False},
    {"id": 2, "name": "Morning Peak Rush", "start_hour": 8, "disruption_level": "MEDIUM", "has_accident": False},
    {"id": 3, "name": "Midday Civil Maintenance Active", "start_hour": 11, "disruption_level": "HIGH", "has_accident": False},
    {"id": 4, "name": "Afternoon Traction Power Block", "start_hour": 13, "disruption_level": "HIGH", "has_accident": False},
    {"id": 5, "name": "Morning Critical Accident at Point 63", "start_hour": 7, "disruption_level": "EXTREME", "has_accident": True, "accident_idx": 0},
    # Validation Set:
    {"id": 6, "name": "Evening Peak Gate Congestion", "start_hour": 17, "disruption_level": "MEDIUM", "has_accident": False},
    {"id": 7, "name": "Night Coordinated Mega Block", "start_hour": 1, "disruption_level": "HIGH", "has_accident": False},
    {"id": 8, "name": "Afternoon Emergency Incident at Tambaram", "start_hour": 14, "disruption_level": "EXTREME", "has_accident": True, "accident_idx": 1},
]

sim_rows = []

for sc in SCENARIO_CONFIGS:
    sc_id = sc["id"]
    train_id = f"EXP-2026-SC{sc_id:02d}"
    sc_start_time = BASE_DATE + datetime.timedelta(hours=sc["start_hour"], minutes=0)
    
    cumulative_actual_mins = 0.0
    
    for st_idx, st in df_stations.iterrows():
        s_id = st["station_id"]
        sched_arr_min = st["baseline_scheduled_arrival_mins"]
        sched_dep_min = st["baseline_scheduled_departure_mins"]
        segment_base = st["baseline_segment_minutes"]
        dwell = st["dwell_time_seconds"] / 60.0
        
        # Calculate stochastic disruptions based on scenario profile
        sig_delay = 0.0
        gate_delay = 0.0
        maint_delay = 0.0
        acc_delay = 0.0
        
        # 1. Signals stochastic check
        if sc["disruption_level"] in ["MEDIUM", "HIGH", "EXTREME"]:
            if random.random() < 0.25: # 25% chance of signal hold
                sig_delay = round(random.uniform(1.0, 3.0), 2)
        elif random.random() < 0.10:
            sig_delay = round(random.uniform(0.5, 1.5), 2)
            
        # 2. Gate stochastic check (at LC stations)
        if s_id in [4, 8, 12, 16, 20, 22]:
            if sc["disruption_level"] in ["MEDIUM", "HIGH", "EXTREME"]:
                if random.random() < 0.40:
                    gate_delay = round(random.uniform(2.0, 5.5), 2)
            elif random.random() < 0.15:
                gate_delay = round(random.uniform(1.0, 3.0), 2)
                
        # 3. Maintenance check
        if sc_id == 3 and s_id >= 21: # Track maint at Urapakkam
            maint_delay += round(random.uniform(8.0, 15.0), 2)
        if sc_id == 4 and s_id >= 17: # Traction maint at Tambaram Sanatorium
            maint_delay += round(random.uniform(10.0, 18.0), 2)
        if sc_id == 7 and s_id >= 10: # Night mega block
            maint_delay += round(random.uniform(6.0, 12.0), 2)
            
        # 4. Accident check
        if sc["has_accident"]:
            acc_info = df_accidents.iloc[sc["accident_idx"]]
            target_station = acc_info["nearest_station_id"]
            if s_id == target_station:
                acc_delay = acc_info["estimated_clearing_delay_minutes"]
                
        # Add transit segment and delays
        if s_id == 1:
            cumulative_actual_mins = dwell
        else:
            cumulative_actual_mins += segment_base + dwell + sig_delay + gate_delay + maint_delay + acc_delay
            
        actual_arr_min = round(cumulative_actual_mins - dwell, 2)
        total_delay_min = round(max(0.0, actual_arr_min - sched_arr_min), 2)
        
        # Binary target: 1 if delayed > 5.0 minutes, 0 otherwise (for Softmax classification)
        is_delayed_binary = 1 if total_delay_min >= 5.0 else 0
        
        sim_rows.append({
            "scenario_id": sc_id,
            "scenario_name": sc["name"],
            "train_id": train_id,
            "station_id": s_id,
            "station_code": st["station_code"],
            "station_name": st["station_name"],
            "is_junction": int(st["is_junction"]),
            "distance_km": st["distance_from_origin_km"],
            "scheduled_arrival_mins": sched_arr_min,
            "signal_delay_mins": sig_delay,
            "gate_delay_mins": gate_delay,
            "maintenance_delay_mins": maint_delay,
            "accident_delay_mins": acc_delay,
            "actual_arrival_mins": actual_arr_min,
            "total_delay_mins": total_delay_min,
            "is_delayed_binary": is_delayed_binary,
            "dataset_split": "TRAIN" if sc_id <= 5 else "VALIDATION"
        })

df_all_scenarios = pd.DataFrame(sim_rows)
df_train = df_all_scenarios[df_all_scenarios["dataset_split"] == "TRAIN"].copy()
df_val = df_all_scenarios[df_all_scenarios["dataset_split"] == "VALIDATION"].copy()

print(f"Total Simulation Rows: {len(df_all_scenarios)} (8 Scenarios x 26 Stations)")
print(f"Training Rows: {len(df_train)} (Scenarios 1-5)")
print(f"Validation Rows: {len(df_val)} (Scenarios 6-8)")

# ----------------------------------------------------------------------
# 4. EXPORT FILES (CSV + TSV + Multi-Sheet Excel Workbook)
# ----------------------------------------------------------------------
# 4.1 Master and Child CSVs
df_stations.to_csv(os.path.join(OUTPUT_DIR, "stations.csv"), index=False)
df_signals.to_csv(os.path.join(OUTPUT_DIR, "signals_events.csv"), index=False)
df_gates.to_csv(os.path.join(OUTPUT_DIR, "gate_openings.csv"), index=False)
df_track_maint.to_csv(os.path.join(OUTPUT_DIR, "track_maintenance.csv"), index=False)
df_engg_maint.to_csv(os.path.join(OUTPUT_DIR, "engineering_maintenance.csv"), index=False)
df_traction_maint.to_csv(os.path.join(OUTPUT_DIR, "traction_maintenance.csv"), index=False)
df_accidents.to_csv(os.path.join(OUTPUT_DIR, "accident_incidents.csv"), index=False)

# 4.2 Colab Train/Val CSVs and TSVs
df_all_scenarios.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_all_scenarios.csv"), index=False)
df_train.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_training.csv"), index=False)
df_val.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_validation.csv"), index=False)
df_train.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_training.tsv"), sep="\t", index=False)
df_val.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_validation.tsv"), sep="\t", index=False)

# 4.3 Comprehensive Multi-Sheet Excel Workbook
excel_path = os.path.join(OUTPUT_DIR, "full_railway_simulation.xlsx")
with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
    df_stations.to_excel(writer, sheet_name="Stations_Master", index=False)
    df_train.to_excel(writer, sheet_name="Training_Scenarios_1_to_5", index=False)
    df_val.to_excel(writer, sheet_name="Validation_Scenarios_6_to_8", index=False)
    df_signals.to_excel(writer, sheet_name="Signals_Events", index=False)
    df_gates.to_excel(writer, sheet_name="Gate_Openings", index=False)
    df_track_maint.to_excel(writer, sheet_name="Track_Maintenance", index=False)
    df_engg_maint.to_excel(writer, sheet_name="Engg_Maintenance", index=False)
    df_traction_maint.to_excel(writer, sheet_name="Traction_Maintenance", index=False)
    df_accidents.to_excel(writer, sheet_name="Accident_Incidents", index=False)

print(f"\n[SUCCESS] All files successfully generated in: {OUTPUT_DIR}")
print(f" - full_railway_simulation.xlsx (Multi-sheet Excel)")
print(f" - train_simulation_training.csv / .tsv (Google Colab Ready)")
print(f" - train_simulation_validation.csv / .tsv (Google Colab Ready)")
