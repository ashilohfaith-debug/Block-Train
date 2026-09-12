#!/usr/bin/env python3
"""
Simulate Railway Network Data: 26-Station Corridor (Chennai Beach to Chengalpattu Junction)
Southern Railway (Chennai Division) South Line Ground Truth

Includes:
1. 26-Station Corridor Master with Exact Chainage (0.00 to 59.84 km) & Dwell Times
2. Railway Crossings Master (All 13 Level Crossings: LC-26 to LC-64 with chainages, status, landmarks)
3. Corridor Signals Master (Full inventory of 72 4-Aspect Signals across the route)
4. Station Signal Counts (Explicit breakdown of how many signals between every station pair)
5. Child Restriction Tables (Signals Events, Gate Openings, Track Maint, Engg Maint, Traction Maint)
6. Accidents & Emergencies Table (Point 63 Saidapet, Point 118 Tambaram, Point 41 Nungambakkam)
7. 8 Simulation Scenarios with Signals Density & Crossing Features for Google Colab (Train/Val CSV & TSV)
8. Multi-Sheet Excel Workbook Export
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

BASE_DATE = datetime.datetime(2026, 9, 15, 0, 0, 0)

# ----------------------------------------------------------------------
# 1. 26-STATION CORRIDOR MASTER (Chennai Beach MSB to Chengalpattu CGL)
# ----------------------------------------------------------------------
STATION_DATA = [
    ("MSB", "STA_A", "Chennai Beach", False, 0.0, 0.0),
    ("MSF", "STA_B", "Chennai Fort", False, 1.80, 3.5),
    ("MPK", "STA_C", "Chennai Park", False, 1.27, 2.5),
    ("MS", "STA_D", "Chennai Egmore", True, 1.25, 2.5),          # Junction 1 (60s dwell)
    ("MSC", "STA_E", "Chetpet", False, 2.24, 4.0),
    ("NBK", "STA_F", "Nungambakkam", False, 1.59, 3.0),
    ("MKK", "STA_G", "Kodambakkam", False, 1.53, 3.0),
    ("MBM", "STA_H", "Mambalam", False, 1.61, 3.2),
    ("SP", "STA_I", "Saidapet", False, 1.61, 3.2),
    ("GDY", "STA_J", "Guindy", True, 2.11, 4.0),                 # Junction 2 (60s dwell)
    ("STM", "STA_K", "St. Thomas Mount", True, 2.11, 4.0),       # Junction 3 (60s dwell)
    ("PZA", "STA_L", "Pazhavanthangal", False, 1.63, 3.2),
    ("MN", "STA_M", "Meenambakkam", False, 1.29, 2.5),
    ("TLM", "STA_N", "Tirusulam", False, 1.18, 2.3),
    ("PV", "STA_O", "Pallavaram", False, 1.93, 3.8),
    ("CMP", "STA_P", "Chromepet", False, 2.20, 4.2),
    ("TBMS", "STA_Q", "Tambaram Sanatorium", False, 2.01, 4.0),
    ("TBM", "STA_R", "Tambaram", True, 1.78, 3.8),               # Junction 4 (60s dwell)
    ("PRGL", "STA_S", "Perungalathur", False, 3.50, 5.5),
    ("VDR", "STA_T", "Vandalur", False, 1.80, 3.5),
    ("UPM", "STA_U", "Urapakkam", False, 3.06, 5.0),
    ("GI", "STA_V", "Guduvancheri", False, 2.91, 4.8),
    ("POTI", "STA_W", "Potheri", False, 3.53, 5.5),
    ("MMNK", "STA_X", "Maraimalai Nagar", False, 3.02, 5.0),
    ("SKL", "STA_Y", "Singaperumal Koil", False, 4.52, 7.0),
    ("CGL", "STA_Z", "Chengalpattu Junction", False, 8.36, 12.0),
]

# ----------------------------------------------------------------------
# 2. REAL RAILWAY CROSSINGS MASTER (Chennai Division Level Crossings)
# Exact LC numbers, chainages, road names, and operating statuses
# ----------------------------------------------------------------------
RAILWAY_CROSSINGS_DATA = [
    {
        "crossing_id": 1,
        "crossing_code": "LC-26",
        "chainage_km": 24.80,
        "station_from_code": "PV",
        "station_to_code": "CMP",
        "location_name": "Radha Nagar, Chromepet",
        "road_name": "Radha Nagar Main Road",
        "crossing_class": "Special Class",
        "gate_type": "Manned Interlocked Barrier",
        "operating_status": "Grade-Separated Subway / Emergency Gate",
        "interlocked_signal_id": "GATE-SIG-LC26",
        "typical_tvu": 420000,
        "avg_closure_seconds": 360
    },
    {
        "crossing_id": 2,
        "crossing_code": "LC-27",
        "chainage_km": 25.80,
        "station_from_code": "CMP",
        "station_to_code": "TBMS",
        "location_name": "MIT Gate, Chromepet",
        "road_name": "Madras Institute of Technology Road",
        "crossing_class": "Special Class",
        "gate_type": "Manned Interlocked Barrier",
        "operating_status": "Pedestrian Subway / Restricting Gate",
        "interlocked_signal_id": "GATE-SIG-LC27",
        "typical_tvu": 380000,
        "avg_closure_seconds": 300
    },
    {
        "crossing_id": 3,
        "crossing_code": "LC-32",
        "chainage_km": 31.80,
        "station_from_code": "TBM",
        "station_to_code": "PRGL",
        "location_name": "Peerkankaranai, North Perungalathur",
        "road_name": "Peerkankaranai Link Road",
        "crossing_class": "Special Class",
        "gate_type": "Manned Interlocked Lifting Barrier",
        "operating_status": "ROB Operational / Yard Gate",
        "interlocked_signal_id": "GATE-SIG-LC32",
        "typical_tvu": 861000,
        "avg_closure_seconds": 420
    },
    {
        "crossing_id": 4,
        "crossing_code": "LC-33",
        "chainage_km": 32.70,
        "station_from_code": "PRGL",
        "station_to_code": "VDR",
        "location_name": "Perungalathur Station Gate",
        "road_name": "GST Road - Perungalathur Connector",
        "crossing_class": "Special Class",
        "gate_type": "Manned Interlocked Lifting Barrier",
        "operating_status": "Active Interlocked",
        "interlocked_signal_id": "GATE-SIG-LC33",
        "typical_tvu": 750000,
        "avg_closure_seconds": 450
    },
    {
        "crossing_id": 5,
        "crossing_code": "LC-36",
        "chainage_km": 35.20,
        "station_from_code": "VDR",
        "station_to_code": "UPM",
        "location_name": "Kolapakkam, Vandalur Zoo North",
        "road_name": "Otteri - Kolapakkam Road",
        "crossing_class": "C Class",
        "gate_type": "Manned Interlocked Barrier",
        "operating_status": "RUB Operational / Emergency Gate",
        "interlocked_signal_id": "GATE-SIG-LC36",
        "typical_tvu": 125000,
        "avg_closure_seconds": 240
    },
    {
        "crossing_id": 6,
        "crossing_code": "LC-43",
        "chainage_km": 36.80,
        "station_from_code": "VDR",
        "station_to_code": "UPM",
        "location_name": "Otteri / Urapakkam North",
        "road_name": "Otteri High Road",
        "crossing_class": "B Class",
        "gate_type": "Manned Interlocked Barrier",
        "operating_status": "ROB Operational / Restricting Gate",
        "interlocked_signal_id": "GATE-SIG-LC43",
        "typical_tvu": 290000,
        "avg_closure_seconds": 300
    },
    {
        "crossing_id": 7,
        "crossing_code": "LC-45",
        "chainage_km": 39.50,
        "station_from_code": "UPM",
        "station_to_code": "GI",
        "location_name": "Nandivaram Gate, Guduvancheri North",
        "road_name": "Nandivaram Lake Link",
        "crossing_class": "B Class",
        "gate_type": "Manned Interlocked Barrier",
        "operating_status": "Active Interlocked",
        "interlocked_signal_id": "GATE-SIG-LC45",
        "typical_tvu": 310000,
        "avg_closure_seconds": 330
    },
    {
        "crossing_id": 8,
        "crossing_code": "LC-47",
        "chainage_km": 41.20,
        "station_from_code": "GI",
        "station_to_code": "POTI",
        "location_name": "Guduvancheri Market Road Gate",
        "road_name": "Guduvancheri - Thiruporur Road",
        "crossing_class": "Special Class",
        "gate_type": "Manned Interlocked Lifting Barrier",
        "operating_status": "Active Interlocked (ROB in Progress)",
        "interlocked_signal_id": "GATE-SIG-LC47",
        "typical_tvu": 680000,
        "avg_closure_seconds": 450
    },
    {
        "crossing_id": 9,
        "crossing_code": "LC-52",
        "chainage_km": 44.80,
        "station_from_code": "POTI",
        "station_to_code": "MMNK",
        "location_name": "Kattankulathur / SRM Link Gate",
        "road_name": "SRM University Access Road",
        "crossing_class": "A Class",
        "gate_type": "Manned Interlocked Lifting Barrier",
        "operating_status": "Active Interlocked",
        "interlocked_signal_id": "GATE-SIG-LC52",
        "typical_tvu": 510000,
        "avg_closure_seconds": 390
    },
    {
        "crossing_id": 10,
        "crossing_code": "LC-55",
        "chainage_km": 46.20,
        "station_from_code": "POTI",
        "station_to_code": "MMNK",
        "location_name": "Maraimalai Nagar Industrial Gate",
        "road_name": "SIDCO Industrial Estate Main Road",
        "crossing_class": "B Class",
        "gate_type": "Manned Interlocked Barrier",
        "operating_status": "Active Interlocked",
        "interlocked_signal_id": "GATE-SIG-LC55",
        "typical_tvu": 340000,
        "avg_closure_seconds": 360
    },
    {
        "crossing_id": 11,
        "crossing_code": "LC-58",
        "chainage_km": 50.80,
        "station_from_code": "MMNK",
        "station_to_code": "SKL",
        "location_name": "Singaperumal Koil Temple Gate",
        "road_name": "Sriperumbudur - Singaperumal Koil Road",
        "crossing_class": "Special Class",
        "gate_type": "Manned Interlocked Lifting Barrier",
        "operating_status": "Active Interlocked (ROB under construction)",
        "interlocked_signal_id": "GATE-SIG-LC58",
        "typical_tvu": 720000,
        "avg_closure_seconds": 480
    },
    {
        "crossing_id": 12,
        "crossing_code": "LC-61",
        "chainage_km": 55.80,
        "station_from_code": "SKL",
        "station_to_code": "CGL",
        "location_name": "Paranur / Mahindra World City Gate",
        "road_name": "Mahindra World City Central Boulevard Link",
        "crossing_class": "Special Class",
        "gate_type": "Manned Interlocked Lifting Barrier",
        "operating_status": "Active Interlocked",
        "interlocked_signal_id": "GATE-SIG-LC61",
        "typical_tvu": 590000,
        "avg_closure_seconds": 420
    },
    {
        "crossing_id": 13,
        "crossing_code": "LC-64",
        "chainage_km": 58.90,
        "station_from_code": "SKL",
        "station_to_code": "CGL",
        "location_name": "Chengalpattu North / Pulipakkam Gate",
        "road_name": "Pulipakkam - Old GST Road",
        "crossing_class": "A Class",
        "gate_type": "Manned Interlocked Barrier",
        "operating_status": "Active Interlocked",
        "interlocked_signal_id": "GATE-SIG-LC64",
        "typical_tvu": 410000,
        "avg_closure_seconds": 360
    }
]
df_crossings = pd.DataFrame(RAILWAY_CROSSINGS_DATA)

# ----------------------------------------------------------------------
# 3. COMPLETE CORRIDOR SIGNALS DEFINITION & STATION-TO-STATION BREAKDOWN
# 4-Aspect Continuous Automatic Block Signalling (ABS) with MACLS
# ----------------------------------------------------------------------
SECTION_SIGNALS_CONFIG = [
    # 1. MSB -> MSF (1.80 km)
    ("MSB", "MSF", [
        ("ABS-SIG-01", "Automatic Signal 01", "AUTOMATIC_BLOCK", 0.90, None),
        ("HOME-SIG-MSF", "Chennai Fort Home Signal", "STATION_HOME", 1.65, None)
    ]),
    # 2. MSF -> MPK (1.27 km)
    ("MSF", "MPK", [
        ("ABS-SIG-02", "Automatic Signal 02", "AUTOMATIC_BLOCK", 2.40, None),
        ("HOME-SIG-MPK", "Chennai Park Home Signal", "STATION_HOME", 2.95, None)
    ]),
    # 3. MPK -> MS (1.25 km)
    ("MPK", "MS", [
        ("ABS-SIG-03", "Automatic Signal 03", "AUTOMATIC_BLOCK", 3.65, None),
        ("HOME-SIG-MS", "Chennai Egmore Jn Home Signal", "STATION_HOME", 4.15, None)
    ]),
    # 4. MS -> MSC (2.24 km)
    ("MS", "MSC", [
        ("ABS-SIG-04", "Automatic Signal 04", "AUTOMATIC_BLOCK", 5.10, None),
        ("ABS-SIG-05", "Automatic Signal 05", "AUTOMATIC_BLOCK", 5.90, None),
        ("HOME-SIG-MSC", "Chetpet Home Signal", "STATION_HOME", 6.40, None)
    ]),
    # 5. MSC -> NBK (1.59 km)
    ("MSC", "NBK", [
        ("ABS-SIG-06", "Automatic Signal 06", "AUTOMATIC_BLOCK", 7.35, None),
        ("HOME-SIG-NBK", "Nungambakkam Home Signal", "STATION_HOME", 7.95, None)
    ]),
    # 6. NBK -> MKK (1.53 km)
    ("NBK", "MKK", [
        ("ABS-SIG-07", "Automatic Signal 07", "AUTOMATIC_BLOCK", 8.90, None),
        ("HOME-SIG-MKK", "Kodambakkam Home Signal", "STATION_HOME", 9.50, None)
    ]),
    # 7. MKK -> MBM (1.61 km)
    ("MKK", "MBM", [
        ("ABS-SIG-08", "Automatic Signal 08", "AUTOMATIC_BLOCK", 10.45, None),
        ("HOME-SIG-MBM", "Mambalam Home Signal", "STATION_HOME", 11.10, None)
    ]),
    # 8. MBM -> SP (1.61 km)
    ("MBM", "SP", [
        ("ABS-SIG-09", "Automatic Signal 09", "AUTOMATIC_BLOCK", 12.10, None),
        ("HOME-SIG-SP", "Saidapet Home Signal", "STATION_HOME", 12.70, None)
    ]),
    # 9. SP -> GDY (2.11 km)
    ("SP", "GDY", [
        ("ABS-SIG-10", "Automatic Signal 10", "AUTOMATIC_BLOCK", 13.60, None),
        ("ABS-SIG-11", "Automatic Signal 11", "AUTOMATIC_BLOCK", 14.40, None),
        ("HOME-SIG-GDY", "Guindy Jn Home Signal", "STATION_HOME", 14.85, None)
    ]),
    # 10. GDY -> STM (2.11 km)
    ("GDY", "STM", [
        ("ABS-SIG-12", "Automatic Signal 12", "AUTOMATIC_BLOCK", 15.70, None),
        ("ABS-SIG-13", "Automatic Signal 13", "AUTOMATIC_BLOCK", 16.50, None),
        ("HOME-SIG-STM", "St. Thomas Mount Jn Home Signal", "STATION_HOME", 16.95, None)
    ]),
    # 11. STM -> PZA (1.63 km)
    ("STM", "PZA", [
        ("ABS-SIG-14", "Automatic Signal 14", "AUTOMATIC_BLOCK", 17.90, None),
        ("HOME-SIG-PZA", "Pazhavanthangal Home Signal", "STATION_HOME", 18.55, None)
    ]),
    # 12. PZA -> MN (1.29 km)
    ("PZA", "MN", [
        ("ABS-SIG-15", "Automatic Signal 15", "AUTOMATIC_BLOCK", 19.35, None),
        ("HOME-SIG-MN", "Meenambakkam Home Signal", "STATION_HOME", 19.85, None)
    ]),
    # 13. MN -> TLM (1.18 km)
    ("MN", "TLM", [
        ("ABS-SIG-16", "Automatic Signal 16", "AUTOMATIC_BLOCK", 20.60, None),
        ("HOME-SIG-TLM", "Tirusulam Home Signal", "STATION_HOME", 21.05, None)
    ]),
    # 14. TLM -> PV (1.93 km)
    ("TLM", "PV", [
        ("ABS-SIG-17", "Automatic Signal 17", "AUTOMATIC_BLOCK", 22.15, None),
        ("HOME-SIG-PV", "Pallavaram Home Signal", "STATION_HOME", 22.95, None)
    ]),
    # 15. PV -> CMP (2.20 km) - contains LC-26 at km 24.80
    ("PV", "CMP", [
        ("ABS-SIG-18", "Automatic Signal 18", "AUTOMATIC_BLOCK", 23.90, None),
        ("GATE-SIG-LC26", "Semi-Automatic Gate Signal LC-26 (Radha Nagar)", "SEMI_AUTO_GATE", 24.60, "LC-26"),
        ("HOME-SIG-CMP", "Chromepet Home Signal", "STATION_HOME", 25.15, None)
    ]),
    # 16. CMP -> TBMS (2.01 km) - contains LC-27 at km 25.80
    ("CMP", "TBMS", [
        ("GATE-SIG-LC27", "Semi-Automatic Gate Signal LC-27 (MIT Gate)", "SEMI_AUTO_GATE", 25.65, "LC-27"),
        ("ABS-SIG-19", "Automatic Signal 19", "AUTOMATIC_BLOCK", 26.50, None),
        ("HOME-SIG-TBMS", "Tambaram Sanatorium Home Signal", "STATION_HOME", 27.15, None)
    ]),
    # 17. TBMS -> TBM (1.78 km)
    ("TBMS", "TBM", [
        ("ABS-SIG-20", "Automatic Signal 20", "AUTOMATIC_BLOCK", 28.10, None),
        ("HOME-SIG-TBM", "Tambaram Jn Home Signal", "STATION_HOME", 28.85, None)
    ]),
    # 18. TBM -> PRGL (3.50 km) - contains LC-32 at km 31.80
    ("TBM", "PRGL", [
        ("ABS-SIG-21", "Automatic Signal 21", "AUTOMATIC_BLOCK", 30.10, None),
        ("ABS-SIG-22", "Automatic Signal 22", "AUTOMATIC_BLOCK", 31.10, None),
        ("GATE-SIG-LC32", "Semi-Automatic Gate Signal LC-32 (Peerkankaranai)", "SEMI_AUTO_GATE", 31.65, "LC-32"),
        ("HOME-SIG-PRGL", "Perungalathur Home Signal", "STATION_HOME", 32.45, None)
    ]),
    # 19. PRGL -> VDR (1.80 km) - contains LC-33 at km 32.70
    ("PRGL", "VDR", [
        ("GATE-SIG-LC33", "Semi-Automatic Gate Signal LC-33 (Perungalathur Gate)", "SEMI_AUTO_GATE", 32.65, "LC-33"),
        ("HOME-SIG-VDR", "Vandalur Home Signal", "STATION_HOME", 34.25, None)
    ]),
    # 20. VDR -> UPM (3.06 km) - contains LC-36 (km 35.20) and LC-43 (km 36.80)
    ("VDR", "UPM", [
        ("GATE-SIG-LC36", "Semi-Automatic Gate Signal LC-36 (Kolapakkam)", "SEMI_AUTO_GATE", 35.10, "LC-36"),
        ("GATE-SIG-LC43", "Semi-Automatic Gate Signal LC-43 (Otteri)", "SEMI_AUTO_GATE", 36.65, "LC-43"),
        ("HOME-SIG-UPM", "Urapakkam Home Signal", "STATION_HOME", 37.30, None)
    ]),
    # 21. UPM -> GI (2.91 km) - contains LC-45 at km 39.50
    ("UPM", "GI", [
        ("ABS-SIG-23", "Automatic Signal 23", "AUTOMATIC_BLOCK", 38.50, None),
        ("GATE-SIG-LC45", "Semi-Automatic Gate Signal LC-45 (Nandivaram)", "SEMI_AUTO_GATE", 39.35, "LC-45"),
        ("HOME-SIG-GI", "Guduvancheri Home Signal", "STATION_HOME", 40.20, None)
    ]),
    # 22. GI -> POTI (3.53 km) - contains LC-47 at km 41.20
    ("GI", "POTI", [
        ("GATE-SIG-LC47", "Semi-Automatic Gate Signal LC-47 (Market Road)", "SEMI_AUTO_GATE", 41.05, "LC-47"),
        ("ABS-SIG-24", "Automatic Signal 24", "AUTOMATIC_BLOCK", 42.10, None),
        ("ABS-SIG-25", "Automatic Signal 25", "AUTOMATIC_BLOCK", 43.10, None),
        ("HOME-SIG-POTI", "Potheri Home Signal", "STATION_HOME", 43.75, None)
    ]),
    # 23. POTI -> MMNK (3.02 km) - contains LC-52 (km 44.80) and LC-55 (km 46.20)
    ("POTI", "MMNK", [
        ("GATE-SIG-LC52", "Semi-Automatic Gate Signal LC-52 (SRM Link)", "SEMI_AUTO_GATE", 44.65, "LC-52"),
        ("GATE-SIG-LC55", "Semi-Automatic Gate Signal LC-55 (Maraimalai Nagar Ind)", "SEMI_AUTO_GATE", 46.05, "LC-55"),
        ("HOME-SIG-MMNK", "Maraimalai Nagar Home Signal", "STATION_HOME", 46.75, None)
    ]),
    # 24. MMNK -> SKL (4.52 km) - contains LC-58 at km 50.80
    ("MMNK", "SKL", [
        ("ABS-SIG-26", "Automatic Signal 26", "AUTOMATIC_BLOCK", 47.90, None),
        ("ABS-SIG-27", "Automatic Signal 27", "AUTOMATIC_BLOCK", 48.90, None),
        ("ABS-SIG-28", "Automatic Signal 28", "AUTOMATIC_BLOCK", 49.90, None),
        ("GATE-SIG-LC58", "Semi-Automatic Gate Signal LC-58 (Singaperumal Koil)", "SEMI_AUTO_GATE", 50.65, "LC-58"),
        ("HOME-SIG-SKL", "Singaperumal Koil Home Signal", "STATION_HOME", 51.30, None)
    ]),
    # 25. SKL -> CGL (8.36 km) - contains LC-61 (km 55.80) and LC-64 (km 58.90)
    ("SKL", "CGL", [
        ("ABS-SIG-29", "Automatic Signal 29", "AUTOMATIC_BLOCK", 52.40, None),
        ("ABS-SIG-30", "Automatic Signal 30", "AUTOMATIC_BLOCK", 53.50, None),
        ("ABS-SIG-31", "Automatic Signal 31", "AUTOMATIC_BLOCK", 54.60, None),
        ("GATE-SIG-LC61", "Semi-Automatic Gate Signal LC-61 (Paranur MWC)", "SEMI_AUTO_GATE", 55.65, "LC-61"),
        ("ABS-SIG-32", "Automatic Signal 32", "AUTOMATIC_BLOCK", 56.70, None),
        ("ABS-SIG-33", "Automatic Signal 33", "AUTOMATIC_BLOCK", 57.80, None),
        ("GATE-SIG-LC64", "Semi-Automatic Gate Signal LC-64 (Chengalpattu North)", "SEMI_AUTO_GATE", 58.75, "LC-64"),
        ("HOME-SIG-CGL", "Chengalpattu Junction Home Signal", "STATION_HOME", 59.50, None)
    ])
]

# Build Signal Inventory and Section Counts
all_signals = []
# Chennai Beach Departure Starter
all_signals.append({
    "signal_id": "STARTER-SIG-MSB",
    "signal_name": "Chennai Beach Platform 1 Starter Signal",
    "signal_type": "STATION_STARTER",
    "aspects_count": 4,
    "aspect_types": "RED, YELLOW, DOUBLE_YELLOW, GREEN",
    "chainage_km": 0.05,
    "section_from_station_code": "MSB",
    "section_to_station_code": "MSF",
    "inter_station_sequence": 1,
    "interlocked_gate_code": "NONE",
    "normal_aspect": "GREEN"
})

section_counts = []
signals_to_next_dict = {}
lcs_to_next_dict = {}

for sec_idx, (st_from, st_to, sig_list) in enumerate(SECTION_SIGNALS_CONFIG, start=1):
    num_auto = sum(1 for s in sig_list if s[2] == "AUTOMATIC_BLOCK")
    num_gate = sum(1 for s in sig_list if s[2] == "SEMI_AUTO_GATE")
    num_home = sum(1 for s in sig_list if s[2] == "STATION_HOME")
    total_sig = len(sig_list)
    sig_ids = [s[0] for s in sig_list]
    
    signals_to_next_dict[st_from] = total_sig
    
    # Check LCs in this section
    sec_lcs = [c["crossing_code"] for c in RAILWAY_CROSSINGS_DATA if c["station_from_code"] == st_from and c["station_to_code"] == st_to]
    lcs_to_next_dict[st_from] = len(sec_lcs)
    
    section_counts.append({
        "section_id": sec_idx,
        "from_station_code": st_from,
        "to_station_code": st_to,
        "total_signals_between": total_sig,
        "num_automatic_signals": num_auto,
        "num_gate_signals": num_gate,
        "num_home_signals": num_home,
        "signal_ids_list": "; ".join(sig_ids),
        "level_crossings_in_section": "; ".join(sec_lcs) if sec_lcs else "NONE"
    })
    
    for s_seq, (s_id, s_name, s_type, s_km, s_gate) in enumerate(sig_list, start=1):
        all_signals.append({
            "signal_id": s_id,
            "signal_name": s_name,
            "signal_type": s_type,
            "aspects_count": 4,
            "aspect_types": "RED, YELLOW, DOUBLE_YELLOW, GREEN",
            "chainage_km": s_km,
            "section_from_station_code": st_from,
            "section_to_station_code": st_to,
            "inter_station_sequence": s_seq,
            "interlocked_gate_code": s_gate if s_gate else "NONE",
            "normal_aspect": "GREEN"
        })

# CGL terminal has 0 signals and 0 LCs to next
signals_to_next_dict["CGL"] = 0
lcs_to_next_dict["CGL"] = 0

df_signals_master = pd.DataFrame(all_signals)
df_section_counts = pd.DataFrame(section_counts)

# Construct df_stations with signals_to_next_station & active_lcs_to_next_station
stations = []
cum_dist = 0.0
cum_time = 0.0

for idx, (code, letter, name, is_junc, dist, run_time) in enumerate(STATION_DATA, start=1):
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
        "station_letter_code": letter,
        "station_name": name,
        "is_junction": is_junc,
        "dwell_time_seconds": dwell_sec,
        "inter_station_distance_km": round(dist, 2),
        "distance_from_origin_km": round(cum_dist, 2),
        "baseline_segment_minutes": run_time,
        "baseline_scheduled_arrival_mins": round(scheduled_arrival, 2),
        "baseline_scheduled_departure_mins": round(scheduled_departure, 2),
        "signals_to_next_station": signals_to_next_dict.get(code, 0),
        "active_lcs_to_next_station": lcs_to_next_dict.get(code, 0)
    })

df_stations = pd.DataFrame(stations)

# Add station names and distances to df_section_counts
df_section_counts["from_station_name"] = df_section_counts["from_station_code"].map(df_stations.set_index("station_code")["station_name"])
df_section_counts["to_station_name"] = df_section_counts["to_station_code"].map(df_stations.set_index("station_code")["station_name"])
df_section_counts["section_length_km"] = df_section_counts["to_station_code"].map(df_stations.set_index("station_code")["inter_station_distance_km"])
df_section_counts["avg_signal_spacing_m"] = round((df_section_counts["section_length_km"] * 1000.0) / (df_section_counts["total_signals_between"] + 1), 1)

# Reorder columns
df_section_counts = df_section_counts[[
    "section_id", "from_station_code", "from_station_name", "to_station_code", "to_station_name",
    "section_length_km", "total_signals_between", "num_automatic_signals", "num_gate_signals",
    "num_home_signals", "signal_ids_list", "level_crossings_in_section", "avg_signal_spacing_m"
]]

# ----------------------------------------------------------------------
# 4. RESTRICTING VARIABLE CHILD TABLES (24-Hour Period)
# ----------------------------------------------------------------------
# 4.1 Dynamic Signal Events (~48 events per day mapped to real signals)
signals = []
for i in range(1, 49):
    hour = (i - 1) * (24 / 48)
    minute = random.randint(0, 25)
    sec = random.randint(0, 59)
    event_time = BASE_DATE + datetime.timedelta(hours=hour, minutes=minute, seconds=sec)
    
    # Pick a random signal from corridor signals master (excluding terminal starter)
    sig_row = df_signals_master.iloc[random.randint(1, len(df_signals_master) - 1)]
    aspect = random.choice(["RED", "YELLOW", "DOUBLE_YELLOW"])
    delay_sec = random.randint(60, 180) if aspect == "RED" else random.randint(30, 90)
    
    signals.append({
        "event_id": i,
        "signal_id": sig_row["signal_id"],
        "signal_name": sig_row["signal_name"],
        "signal_type": sig_row["signal_type"],
        "chainage_km": sig_row["chainage_km"],
        "section_from_station_code": sig_row["section_from_station_code"],
        "section_to_station_code": sig_row["section_to_station_code"],
        "event_timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S"),
        "signal_aspect": aspect,
        "delay_seconds": delay_sec,
        "delay_minutes": round(delay_sec / 60.0, 2)
    })
df_signals = pd.DataFrame(signals)

# 4.2 Dynamic Gate Openings (~72 openings per day across 13 real level crossings)
gates = []
for i in range(1, 73):
    hour = (i - 1) * (24 / 72)
    minute = random.randint(0, 15)
    sec = random.randint(0, 59)
    open_time = BASE_DATE + datetime.timedelta(hours=hour, minutes=minute, seconds=sec)
    duration_sec = random.randint(240, 480) # 4 to 8 minutes
    close_time = open_time + datetime.timedelta(seconds=duration_sec)
    
    gate_row = df_crossings.sample(1).iloc[0]
    
    gates.append({
        "opening_id": i,
        "crossing_code": gate_row["crossing_code"],
        "location_name": gate_row["location_name"],
        "chainage_km": gate_row["chainage_km"],
        "station_from_code": gate_row["station_from_code"],
        "station_to_code": gate_row["station_to_code"],
        "crossing_class": gate_row["crossing_class"],
        "operating_status": gate_row["operating_status"],
        "open_timestamp": open_time.strftime("%Y-%m-%d %H:%M:%S"),
        "close_timestamp": close_time.strftime("%Y-%m-%d %H:%M:%S"),
        "open_duration_seconds": duration_sec,
        "delay_impact_minutes": round(duration_sec / 60.0, 2)
    })
df_gates = pd.DataFrame(gates)

# 4.3 Track Maintenance (Civil / P-Way)
track_maint = [
    {
        "block_id": 1,
        "station_id": 16, # Chromepet
        "station_code": "CMP",
        "station_name": "Chromepet",
        "work_type": "CSM_TAMPING_PACKING",
        "equipment_used": "Plasser & Theurer CSM 09-32",
        "start_time": (BASE_DATE + datetime.timedelta(hours=1, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=3, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 120,
        "speed_restriction_kmh": 30
    },
    {
        "block_id": 2,
        "station_id": 21, # Urapakkam
        "station_code": "UPM",
        "station_name": "Urapakkam",
        "work_type": "BCM_BALLAST_CLEANING",
        "equipment_used": "BCM RM-80 Ballast Cleaner",
        "start_time": (BASE_DATE + datetime.timedelta(hours=11, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=13, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 120,
        "speed_restriction_kmh": 20
    },
    {
        "block_id": 3,
        "station_id": 25, # Singaperumal Koil
        "station_code": "SKL",
        "station_name": "Singaperumal Koil",
        "work_type": "USFD_RAIL_TESTING",
        "equipment_used": "Ultrasonic Flaw Detection Trolley",
        "start_time": (BASE_DATE + datetime.timedelta(hours=14, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=15, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 90,
        "speed_restriction_kmh": 45
    }
]
df_track_maint = pd.DataFrame(track_maint)

# 4.4 Engineering Maintenance (Structural / Turnouts)
engg_maint = [
    {
        "block_id": 1,
        "station_id": 8, # Mambalam
        "station_code": "MBM",
        "station_name": "Mambalam",
        "work_type": "TURNOUT_SWITCH_OVERHAUL",
        "start_time": (BASE_DATE + datetime.timedelta(hours=2, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=3, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 90
    },
    {
        "block_id": 2,
        "station_id": 18, # Tambaram
        "station_code": "TBM",
        "station_name": "Tambaram",
        "work_type": "FOOT_OVER_BRIDGE_GIRDER_INSPECTION",
        "start_time": (BASE_DATE + datetime.timedelta(hours=12, minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=13, minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 90
    }
]
df_engg_maint = pd.DataFrame(engg_maint)

# 4.5 Traction Maintenance (OHE Electrical Power Block)
traction_maint = [
    {
        "block_id": 1,
        "station_id": 10, # Guindy
        "station_code": "GDY",
        "station_name": "Guindy",
        "work_type": "OHE_CONTACT_WIRE_ADJUSTMENT",
        "equipment_used": "8-Wheeler Diesel-Electric Tower Wagon (DETW)",
        "start_time": (BASE_DATE + datetime.timedelta(hours=1, minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=3, minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 120,
        "power_block_de_energized": True
    },
    {
        "block_id": 2,
        "station_id": 17, # Tambaram Sanatorium
        "station_code": "TBMS",
        "station_name": "Tambaram Sanatorium",
        "work_type": "CATENARY_INSULATOR_WASHING",
        "equipment_used": "High-Pressure Jet Tower Wagon",
        "start_time": (BASE_DATE + datetime.timedelta(hours=13, minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
        "end_time": (BASE_DATE + datetime.timedelta(hours=15, minutes=0)).strftime("%Y-%m-%d %H:%M:%S"),
        "duration_minutes": 90,
        "power_block_de_energized": True
    }
]
df_traction_maint = pd.DataFrame(traction_maint)

# 4.6 Accident / Emergency Events (~3 incidents per day)
accidents = [
    {
        "accident_id": 1,
        "incident_timestamp": (BASE_DATE + datetime.timedelta(hours=7, minutes=18)).strftime("%Y-%m-%d %H:%M:%S"),
        "track_point_marker": 63, # Point 63 as specified
        "nearest_station_id": 9,  # Saidapet
        "station_code": "SP",
        "station_name": "Saidapet",
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
        "nearest_station_id": 18, # Tambaram Yard
        "station_code": "TBM",
        "station_name": "Tambaram",
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
        "station_code": "NBK",
        "station_name": "Nungambakkam",
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
# 5. GENERATE 8 SIMULATION SCENARIOS (With Signals & LC Density Features)
# Scenarios 1-5: Training set (130 rows)
# Scenarios 6-8: Validation set (78 rows)
# ----------------------------------------------------------------------
SCENARIO_CONFIGS = [
    {"id": 1, "name": "Early Morning Clean Run", "start_hour": 5, "disruption_level": "LOW", "has_accident": False},
    {"id": 2, "name": "Morning Peak Rush (Heavy Headway)", "start_hour": 8, "disruption_level": "MEDIUM", "has_accident": False},
    {"id": 3, "name": "Midday Civil Ballast Cleaning Block", "start_hour": 11, "disruption_level": "HIGH", "has_accident": False},
    {"id": 4, "name": "Afternoon OHE Traction Power Block", "start_hour": 13, "disruption_level": "HIGH", "has_accident": False},
    {"id": 5, "name": "Morning Critical Accident at Point 63", "start_hour": 7, "disruption_level": "EXTREME", "has_accident": True, "accident_idx": 0},
    # Validation Set:
    {"id": 6, "name": "Evening Peak Gate Congestion (GST Road)", "start_hour": 17, "disruption_level": "MEDIUM", "has_accident": False},
    {"id": 7, "name": "Night Integrated Mega Block (Civil+OHE)", "start_hour": 1, "disruption_level": "HIGH", "has_accident": False},
    {"id": 8, "name": "Afternoon Yard Incident at Tambaram", "start_hour": 14, "disruption_level": "EXTREME", "has_accident": True, "accident_idx": 1},
]

sim_rows = []

for sc in SCENARIO_CONFIGS:
    sc_id = sc["id"]
    train_id = f"SR-EMU-{sc_id:02d}"
    
    cumulative_actual_mins = 0.0
    
    for st_idx, st in df_stations.iterrows():
        s_id = st["station_id"]
        sched_arr_min = st["baseline_scheduled_arrival_mins"]
        segment_base = st["baseline_segment_minutes"]
        dwell = st["dwell_time_seconds"] / 60.0
        
        # Section signals and LC density traversed leading into this station
        if st_idx > 0:
            prev_code = df_stations.iloc[st_idx - 1]["station_code"]
            signals_in_sec = signals_to_next_dict.get(prev_code, 2)
            lcs_in_sec = lcs_to_next_dict.get(prev_code, 0)
        else:
            signals_in_sec = 0
            lcs_in_sec = 0
        
        # Calculate stochastic disruptions based on scenario profile & density
        sig_delay = 0.0
        gate_delay = 0.0
        maint_delay = 0.0
        acc_delay = 0.0
        
        # 1. Signals stochastic check (Scaled by number of signals in block section)
        if signals_in_sec > 0:
            sig_prob = 0.08 * signals_in_sec
            if sc["disruption_level"] in ["MEDIUM", "HIGH", "EXTREME"]:
                sig_prob = min(0.65, 0.15 * signals_in_sec)
                if random.random() < sig_prob:
                    sig_delay = round(random.uniform(0.8, 2.8) * (1 + 0.1 * signals_in_sec), 2)
            elif random.random() < sig_prob:
                sig_delay = round(random.uniform(0.4, 1.2), 2)
            
        # 2. Gate stochastic check (Present only if section has level crossings)
        if lcs_in_sec > 0:
            gate_prob = 0.20 * lcs_in_sec
            if sc["disruption_level"] in ["MEDIUM", "HIGH", "EXTREME"]:
                gate_prob = min(0.70, 0.35 * lcs_in_sec)
                if random.random() < gate_prob:
                    gate_delay = round(random.uniform(2.0, 5.0) * lcs_in_sec, 2)
            elif random.random() < gate_prob:
                gate_delay = round(random.uniform(1.0, 2.5) * lcs_in_sec, 2)
                
        # 3. Maintenance check
        if sc_id == 3 and s_id >= 21: # Track maint at Urapakkam
            maint_delay += round(random.uniform(8.0, 15.0), 2)
        if sc_id == 4 and s_id >= 17: # Traction maint at Tambaram Sanatorium
            maint_delay += round(random.uniform(10.0, 18.0), 2)
        if sc_id == 7 and s_id >= 10: # Night mega block from Guindy
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
        
        # Binary target: 1 if delayed >= 5.0 minutes, 0 otherwise (for Softmax classification)
        is_delayed_binary = 1 if total_delay_min >= 5.0 else 0
        
        sim_rows.append({
            "scenario_id": sc_id,
            "scenario_name": sc["name"],
            "train_id": train_id,
            "station_id": s_id,
            "station_code": st["station_code"],
            "station_letter_code": st["station_letter_code"],
            "station_name": st["station_name"],
            "is_junction": int(st["is_junction"]),
            "distance_km": st["distance_from_origin_km"],
            "scheduled_arrival_mins": sched_arr_min,
            "signals_in_section": signals_in_sec,
            "lcs_in_section": lcs_in_sec,
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
# 6. EXPORT FILES (CSV + TSV + Multi-Sheet Excel Workbook)
# ----------------------------------------------------------------------
# 6.1 Master and Inventory CSVs
df_stations.to_csv(os.path.join(OUTPUT_DIR, "stations.csv"), index=False)
df_crossings.to_csv(os.path.join(OUTPUT_DIR, "railway_crossings.csv"), index=False)
df_signals_master.to_csv(os.path.join(OUTPUT_DIR, "corridor_signals_master.csv"), index=False)
df_section_counts.to_csv(os.path.join(OUTPUT_DIR, "station_signal_counts.csv"), index=False)

# 6.2 Child Restriction Tables
df_signals.to_csv(os.path.join(OUTPUT_DIR, "signals_events.csv"), index=False)
df_gates.to_csv(os.path.join(OUTPUT_DIR, "gate_openings.csv"), index=False)
df_track_maint.to_csv(os.path.join(OUTPUT_DIR, "track_maintenance.csv"), index=False)
df_engg_maint.to_csv(os.path.join(OUTPUT_DIR, "engineering_maintenance.csv"), index=False)
df_traction_maint.to_csv(os.path.join(OUTPUT_DIR, "traction_maintenance.csv"), index=False)
df_accidents.to_csv(os.path.join(OUTPUT_DIR, "accident_incidents.csv"), index=False)

# 6.3 Google Colab Train/Val CSVs and TSVs
df_all_scenarios.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_all_scenarios.csv"), index=False)
df_train.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_training.csv"), index=False)
df_val.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_validation.csv"), index=False)
df_train.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_training.tsv"), sep="\t", index=False)
df_val.to_csv(os.path.join(OUTPUT_DIR, "train_simulation_validation.tsv"), sep="\t", index=False)

# 6.4 Comprehensive Multi-Sheet Excel Workbook
excel_path = os.path.join(OUTPUT_DIR, "full_railway_simulation.xlsx")
with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
    df_stations.to_excel(writer, sheet_name="Stations_Master", index=False)
    df_section_counts.to_excel(writer, sheet_name="Station_Signal_Counts", index=False)
    df_signals_master.to_excel(writer, sheet_name="Corridor_Signals_Master", index=False)
    df_crossings.to_excel(writer, sheet_name="Railway_Crossings_Master", index=False)
    df_train.to_excel(writer, sheet_name="Training_Scenarios_1_to_5", index=False)
    df_val.to_excel(writer, sheet_name="Validation_Scenarios_6_to_8", index=False)
    df_signals.to_excel(writer, sheet_name="Signals_Events", index=False)
    df_gates.to_excel(writer, sheet_name="Gate_Openings", index=False)
    df_track_maint.to_excel(writer, sheet_name="Track_Maintenance", index=False)
    df_engg_maint.to_excel(writer, sheet_name="Engg_Maintenance", index=False)
    df_traction_maint.to_excel(writer, sheet_name="Traction_Maintenance", index=False)
    df_accidents.to_excel(writer, sheet_name="Accident_Incidents", index=False)

print(f"\n[SUCCESS] All datasets cleanly generated and stored in: {OUTPUT_DIR}")
print(f"  1. stations.csv ({len(df_stations)} stations with signals_to_next_station & active_lcs_to_next_station)")
print(f"  2. railway_crossings.csv ({len(df_crossings)} real level crossings LC-26 to LC-64 with chainage & status)")
print(f"  3. corridor_signals_master.csv ({len(df_signals_master)} 4-aspect signal posts cataloged along corridor)")
print(f"  4. station_signal_counts.csv ({len(df_section_counts)} inter-station sections with signal counts & spacing)")
print(f"  5. signals_events.csv ({len(df_signals)} dynamic events mapped to signals)")
print(f"  6. gate_openings.csv ({len(df_gates)} dynamic events mapped to crossings)")
print(f"  7. track_maintenance.csv, engineering_maintenance.csv, traction_maintenance.csv")
print(f"  8. accident_incidents.csv")
print(f"  9. train_simulation_training.csv / .tsv ({len(df_train)} rows with signals_in_section feature)")
print(f" 10. train_simulation_validation.csv / .tsv ({len(df_val)} rows with signals_in_section feature)")
print(f" 11. train_simulation_all_scenarios.csv ({len(df_all_scenarios)} rows)")
print(f" 12. full_railway_simulation.xlsx (Multi-sheet Excel with 12 detailed sheets)")
