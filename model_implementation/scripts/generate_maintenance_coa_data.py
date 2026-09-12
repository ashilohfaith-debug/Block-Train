"""
Generate Real-World Synthetic Datasets for Ministry of Railways Problem Statement 26027:
AI-Powered Automatic Block Planning to Maximize Asset Availability

Generates 4 Key Data Silos across the 26-Station Chennai Beach to Chengalpattu Corridor:
1. TMS (Track Management System - Civil Engineering)
2. SMMS (Signalling Maintenance & Management System - S&T)
3. TDMS (Traction Distribution Management System - Electrical TRD)
4. COA (Control Office Application - Train Timetables & Available Block Corridor Windows)
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Set seeds for deterministic reproducibility
random.seed(42)
np.random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ----------------------------------------------------------------------
# 1. CORRIDOR GROUND-TRUTH REFERENCES
# ----------------------------------------------------------------------
STATIONS = [
    ("MSB", "Chennai Beach", 0.00, True),
    ("MSF", "Chennai Fort", 1.80, False),
    ("MPK", "Chennai Park", 3.07, False),
    ("MS", "Chennai Egmore", 4.32, True),
    ("MSC", "Chetpet", 6.56, False),
    ("NBK", "Nungambakkam", 8.15, False),
    ("MKK", "Kodambakkam", 9.68, False),
    ("MBM", "Mambalam", 11.29, False),
    ("SP", "Saidapet", 12.90, False),
    ("GDY", "Guindy", 15.01, True),
    ("STM", "St. Thomas Mount", 17.12, True),
    ("PZA", "Pazhavanthangal", 18.75, False),
    ("MN", "Meenambakkam", 20.04, False),
    ("TLM", "Tirusulam", 21.22, False),
    ("PV", "Pallavaram", 23.15, False),
    ("CMP", "Chromepet", 25.35, False),
    ("TBMS", "Tambaram Sanatorium", 27.36, False),
    ("TBM", "Tambaram", 29.14, True),
    ("PRGL", "Perungalathur", 32.64, False),
    ("VDR", "Vandalur", 34.44, False),
    ("UPM", "Urapakkam", 37.50, False),
    ("GI", "Guduvancheri", 40.41, False),
    ("POTI", "Potheri", 43.94, False),
    ("MMNK", "Maraimalai Nagar", 46.96, False),
    ("SKL", "Singaperumal Koil", 51.48, False),
    ("CGL", "Chengalpattu Junction", 59.84, True),
]

TRACK_LINES_URBAN = ["LINE_1_SUBURBAN_DN", "LINE_2_SUBURBAN_UP", "LINE_3_MAIN_DN", "LINE_4_MAIN_UP"]
TRACK_LINES_OUTER = ["LINE_1_SUBURBAN_DN", "LINE_2_SUBURBAN_UP", "3RD_LINE_BIDIRECTIONAL"]

# High-priority points & signals for realistic defect placement
KEY_SWITCH_POINTS = [
    ("TBM", 29.14, 118, "Scissors Crossover EMU Yard Neck"),
    ("MS", 4.32, 12, "Egmore Main Coaching Turnout"),
    ("GDY", 15.01, 35, "Universal Crossover"),
    ("SP", 12.90, 63, "Adyar River Bridge Approach Crossover"),
    ("NBK", 8.15, 41, "Emergency Facing Crossover"),
    ("STM", 17.12, 82, "Fast to Slow Line Crossover"),
    ("CGL", 59.84, 175, "Villupuram Bifurcation Turnout"),
    ("MMNK", 46.96, 142, "Auto Logistic Freight Siding Turnout"),
]

# ----------------------------------------------------------------------
# 2. GENERATE TMS (TRACK MANAGEMENT SYSTEM) DEFECTS
# ----------------------------------------------------------------------
def generate_tms_data(n_records=300):
    tms_records = []
    
    defect_types = [
        ("IMR_ULTRASONIC_FLAW", "Immediate Removal rail flaw detected by USFD trolley", 8, 10, 3.0, "MANUAL_WELDING_GANG"),
        ("RAIL_FRACTURE_RISK", "Fishplate bolt hole crack / micro-fracture near heat zone", 9, 10, 3.5, "EMERGENCY_RAIL_REPLACEMENT"),
        ("TRACK_GEOMETRY_BAD_TGI", "Track Geometry Index (TGI) below 60 requiring tamping", 6, 8, 4.0, "CSM_09_32_TAMPER"),
        ("WELD_COLLAR_FATIGUE", "AT Weld visual defect exceeding permissible tolerance", 6, 8, 2.5, "AT_WELDING_CREW"),
        ("BALLAST_DEFICIENCY", "Deep screening & shoulder cleaning required", 4, 6, 4.5, "BALLAST_CLEANER_BCM"),
        ("SLEEPER_CRACK_FATIGUE", "Prestressed concrete sleeper cracked under high axle load", 4, 6, 2.5, "SLEEPER_REPLACEMENT_TEAM"),
        ("RAIL_CORRUGATION_WEAR", "Severe rail corrugation and wheel burn marks", 4, 6, 3.0, "RAIL_GRINDING_MACHINE_RGM"),
        ("TURNOUT_STOCK_RAIL_WEAR", "Tongue & stock rail wear at crossover points", 6, 8, 3.5, "PWAY_TURNOUT_CREW"),
        ("ROUTINE_FISHPLATE_GREASING", "Periodic greasing of fishplates and checking torque bolts", 1, 3, 1.5, "MANUAL_GANG_TOOLS"),
        ("BALLAST_PACKING_ROUTINE", "Routine manual off-track shoulder ballast packing", 2, 4, 2.0, "OFF_TRACK_TAMPER"),
        ("RAIL_FLANGE_LUBRICATION", "Electronic track lubricator grease replenishment", 1, 3, 1.0, "MANUAL_MAINTENANCE_CREW"),
    ]
    
    for i in range(1, n_records + 1):
        st_code, st_name, st_km, is_junc = random.choice(STATIONS)
        offset_km = round(random.uniform(-0.8, 0.8), 2)
        chainage = max(0.1, min(59.7, round(st_km + offset_km, 2)))
        
        track = random.choice(TRACK_LINES_URBAN if chainage <= 29.14 else TRACK_LINES_OUTER)
        
        d_type, d_desc, min_risk, max_risk, base_hrs, machine = random.choice(defect_types)
        
        asset_age = round(random.uniform(0.5, 16.0), 1)
        overdue_days = int(np.random.exponential(scale=10))
        gmt = round(random.uniform(18.0, 52.0), 1)  # Gross Million Tonnes
        
        safety_risk = min(10, max(1, int(random.randint(min_risk, max_risk) + (1 if overdue_days > 25 else 0))))
        
        # Calculate MPI (Maintenance Priority Index 0 to 100)
        mpi = round(min(100.0, max(5.0, (safety_risk * 5.0) + (overdue_days * 0.7) + (gmt * 0.2) + (asset_age * 0.5) - 5.0)), 1)
        
        if mpi >= 75 or safety_risk >= 9:
            urgency = "CRITICAL_EMERGENCY"
            tsr = random.choice([15, 20, 30])
        elif mpi >= 55:
            urgency = "HIGH_PRIORITY"
            tsr = random.choice([30, 45, 50])
        elif mpi >= 35:
            urgency = "MEDIUM_PLANNED"
            tsr = None
        else:
            urgency = "ROUTINE_CYCLE"
            tsr = None
            
        tms_records.append({
            "defect_id": f"TMS-DEF-{i:04d}",
            "department": "ENGINEERING_CIVIL",
            "system_source": "TMS",
            "station_code": st_code,
            "station_name": st_name,
            "chainage_km": chainage,
            "track_id": track,
            "defect_category": d_type,
            "defect_description": d_desc,
            "asset_age_years": asset_age,
            "overdue_days": overdue_days,
            "gmt_traffic_load": gmt,
            "speed_restriction_kmh": tsr if tsr else 0,
            "has_active_tsr": 1 if tsr else 0,
            "estimated_repair_hours": base_hrs,
            "machinery_required": machine,
            "safety_risk_score": safety_risk,
            "target_mpi_score": mpi,
            "urgency_level": urgency
        })
        
    return pd.DataFrame(tms_records)

# ----------------------------------------------------------------------
# 3. GENERATE SMMS (SIGNALLING & TELECOM) DEFECTS
# ----------------------------------------------------------------------
def generate_smms_data(n_records=250):
    smms_records = []
    
    defect_types = [
        ("POINT_MACHINE_MOTOR_SLUGGISH", "Point machine operation time sluggish (>4.5s vs 3.5s limit)", "POINT_MACHINE", 7, 9, 2.0),
        ("POINT_GROUND_CONNECTION_WEAR", "Lock rod slack and stretcher bar clearance out of gauge", "POINT_MACHINE", 8, 10, 2.5),
        ("SIGNAL_ASPECT_LED_DEGRADATION", "Main aspect LED unit luminous intensity below safety threshold", "ABS_SIGNAL_POST", 5, 7, 1.0),
        ("AXLE_COUNTER_DRIFT", "High-frequency wheel sensor signal amplitude drift on rail foot", "DIGITAL_AXLE_COUNTER", 7, 9, 1.5),
        ("TRACK_CIRCUIT_INSULATION_FAIL", "G3(L) nylon insulated rail joint resistance dropped <100 ohms", "TRACK_CIRCUIT", 6, 8, 2.0),
        ("CABLE_INSULATION_DROP", "Underground signaling multicore cable megger value below 1 MOhm/km", "SIGNALLING_CABLE", 5, 7, 3.0),
        ("ELECTRONIC_INTERLOCKING_CARD", "Hot standby CPU card transient communication packet loss", "ELECTRONIC_INTERLOCKING", 8, 10, 1.5),
        ("ROUTINE_POINT_CLEANING_GREASING", "Bi-weekly point cleaning, graphite greasing and switch chair plate check", "POINT_MACHINE", 1, 3, 1.0),
        ("SIGNAL_BATTERY_WATERING", "Maintenance of 110V battery bank & electrolyte specific gravity check", "POWER_SUPPLY", 2, 3, 1.5),
        ("LED_UNIT_ROUTINE_INSPECTION", "Quarterly photometric Lux measurement and aspect lens cleaning", "ABS_SIGNAL_POST", 1, 3, 1.0),
    ]
    
    for i in range(1, n_records + 1):
        if random.random() < 0.35:
            st_code, st_km, pt_num, pt_desc = random.choice(KEY_SWITCH_POINTS)
            st_name = [s[1] for s in STATIONS if s[0] == st_code][0]
            chainage = st_km
            asset_id = f"POINT-{pt_num}"
            asset_type = "POINT_MACHINE"
            d_type, d_desc, _, min_risk, max_risk, base_hrs = defect_types[0] if random.random() < 0.5 else defect_types[1]
        else:
            st_code, st_name, st_km, _ = random.choice(STATIONS)
            chainage = round(max(0.1, min(59.7, st_km + random.uniform(-0.5, 0.5))), 2)
            d_type, d_desc, asset_type, min_risk, max_risk, base_hrs = random.choice(defect_types)
            asset_id = f"SIG-{st_code}-{random.randint(10, 99)}"
            
        asset_age = round(random.uniform(0.5, 15.0), 1)
        overdue_days = int(np.random.exponential(scale=10))
        op_cycles_k = round(random.uniform(15.0, 320.0), 1)
        
        safety_risk = min(10, max(1, int(random.randint(min_risk, max_risk) + (1 if overdue_days > 20 else 0))))
        
        # MPI for S&T
        mpi = round(min(100.0, max(5.0, (safety_risk * 5.0) + (overdue_days * 0.8) + (op_cycles_k * 0.05) + (asset_age * 0.4) - 5.0)), 1)
        
        if mpi >= 75 or safety_risk >= 9:
            urgency = "CRITICAL_EMERGENCY"
        elif mpi >= 55:
            urgency = "HIGH_PRIORITY"
        elif mpi >= 35:
            urgency = "MEDIUM_PLANNED"
        else:
            urgency = "ROUTINE_CYCLE"
            
        smms_records.append({
            "defect_id": f"SMMS-DEF-{i:04d}",
            "department": "S_AND_T",
            "system_source": "SMMS",
            "station_code": st_code,
            "station_name": st_name,
            "chainage_km": chainage,
            "asset_id": asset_id,
            "asset_type": asset_type,
            "defect_category": d_type,
            "defect_description": d_desc,
            "asset_age_years": asset_age,
            "overdue_days": overdue_days,
            "operating_cycles_thousands": op_cycles_k,
            "estimated_repair_hours": base_hrs,
            "safety_risk_score": safety_risk,
            "target_mpi_score": mpi,
            "urgency_level": urgency
        })
        
    return pd.DataFrame(smms_records)

# ----------------------------------------------------------------------
# 4. GENERATE TDMS (TRACTION DISTRIBUTION / OHE) DEFECTS
# ----------------------------------------------------------------------
def generate_tdms_data(n_records=220):
    tdms_records = []
    
    defect_types = [
        ("CONTACT_WIRE_CONDEMNING_WEAR", "Contact wire residual diameter worn down to 8.2mm (condemning limit 8.25mm)", 8, 10, 3.0, True),
        ("CATENARY_DROPPER_FATIGUE", "Loose/broken flexible current droppers sparking under pantograph passage", 6, 8, 2.0, False),
        ("INSULATOR_FLASHOVER_RISK", "Severe pollution & industrial carbon coating on 25kV composite insulator", 6, 8, 2.5, False),
        ("CANTILEVER_BRACKET_MISALIGN", "Cantilever bracket registration arm shifted due to thermal expansion", 4, 6, 2.0, False),
        ("SECTION_INSULATOR_PITTING", "Section insulator runner burnt requiring re-alignment and replacement", 7, 9, 2.5, True),
        ("NEUTRAL_SECTION_MAINTENANCE", "PTFE short neutral section assembly inspection and arc horn gap setting", 8, 10, 3.5, True),
        ("ROUTINE_MAST_BONDING_CHECK", "Checking track bonding and structure bond continuity", 1, 3, 1.0, False),
        ("INSULATOR_ROUTINE_CLEANING", "Scheduled dry cleaning and visual inspection of 25kV bracket insulators", 2, 4, 1.5, False),
        ("OHE_HEIGHT_STAGGER_ROUTINE", "Routine measurement of contact wire height and stagger at masts", 2, 3, 1.5, False),
    ]
    
    for i in range(1, n_records + 1):
        st_code, st_name, st_km, _ = random.choice(STATIONS)
        chainage = round(max(0.1, min(59.7, st_km + random.uniform(-0.7, 0.7))), 2)
        track = random.choice(TRACK_LINES_URBAN if chainage <= 29.14 else TRACK_LINES_OUTER)
        
        d_type, d_desc, min_risk, max_risk, base_hrs, tower_wagon = random.choice(defect_types)
        
        asset_age = round(random.uniform(0.5, 18.0), 1)
        overdue_days = int(np.random.exponential(scale=10))
        hotspot_temp = round(random.uniform(35.0, 92.0), 1)  # Thermovision temperature in Celsius
        
        safety_risk = min(10, max(1, int(random.randint(min_risk, max_risk) + (1 if hotspot_temp > 75.0 else 0))))
        
        mpi = round(min(100.0, max(5.0, (safety_risk * 5.0) + (overdue_days * 0.7) + ((hotspot_temp - 35) * 0.3) + (asset_age * 0.4) - 5.0)), 1)
        
        if mpi >= 75 or safety_risk >= 9:
            urgency = "CRITICAL_EMERGENCY"
        elif mpi >= 55:
            urgency = "HIGH_PRIORITY"
        elif mpi >= 35:
            urgency = "MEDIUM_PLANNED"
        else:
            urgency = "ROUTINE_CYCLE"
            
        tdms_records.append({
            "defect_id": f"TDMS-DEF-{i:04d}",
            "department": "ELECTRICAL_TRD",
            "system_source": "TDMS",
            "station_code": st_code,
            "station_name": st_name,
            "chainage_km": chainage,
            "track_id": track,
            "defect_category": d_type,
            "defect_description": d_desc,
            "asset_age_years": asset_age,
            "overdue_days": overdue_days,
            "hotspot_temp_celsius": hotspot_temp,
            "estimated_repair_hours": base_hrs,
            "power_block_required": 1,
            "tower_wagon_required": 1 if tower_wagon else 0,
            "safety_risk_score": safety_risk,
            "target_mpi_score": mpi,
            "urgency_level": urgency
        })
        
    return pd.DataFrame(tdms_records)

# ----------------------------------------------------------------------
# 5. GENERATE COA (CONTROL OFFICE APPLICATION) CORRIDOR TIMETABLES & GAPS
# ----------------------------------------------------------------------
def generate_coa_corridor_windows():
    """
    Creates available track possession windows across 3 major corridor zones:
    1. Zone A: Chennai Beach to Egmore (MSB to MS: 0.00 - 4.32 km)
    2. Zone B: Chennai Egmore to Tambaram (MS to TBM: 4.32 - 29.14 km)
    3. Zone C: Tambaram to Chengalpattu (TBM to CGL: 29.14 - 59.84 km)
    """
    coa_slots = []
    
    # 7 Days in Weekly Planning Cycle
    start_date = datetime(2026, 9, 14, 0, 0)  # Monday
    
    slot_id = 1
    for day in range(7):
        current_date = start_date + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d")
        
        # 1. Night Corridor Maintenance Windows (00:30 to 04:00) - The Primary Mega Block Window
        night_slots = [
            ("ZONE_B_MS_TBM", "MS", "TBM", "LINE_1_SUBURBAN_DN", f"{date_str} 00:45:00", f"{date_str} 03:45:00", 180, "EMU-4001-LAST", "EMU-4003-FIRST", "LOW"),
            ("ZONE_B_MS_TBM", "MS", "TBM", "LINE_2_SUBURBAN_UP", f"{date_str} 01:00:00", f"{date_str} 04:00:00", 180, "EMU-4002-LAST", "EMU-4004-FIRST", "LOW"),
            ("ZONE_C_TBM_CGL", "TBM", "CGL", "3RD_LINE_BIDIRECTIONAL", f"{date_str} 00:30:00", f"{date_str} 04:00:00", 210, "EXP-12637-PANDIAN", "FREIGHT-AUTO-MMNK", "LOW"),
            ("ZONE_C_TBM_CGL", "TBM", "CGL", "LINE_1_SUBURBAN_DN", f"{date_str} 01:15:00", f"{date_str} 03:45:00", 150, "EMU-4015-LAST", "EMU-4017-FIRST", "LOW"),
            ("ZONE_A_MSB_MS", "MSB", "MS", "LINE_1_SUBURBAN_DN", f"{date_str} 01:00:00", f"{date_str} 03:30:00", 150, "EMU-4009-LAST", "EMU-4011-FIRST", "LOW"),
        ]
        
        for z, f_st, t_st, trk, s_t, e_t, dur, t_bef, t_aft, rsk in night_slots:
            coa_slots.append({
                "block_slot_id": f"COA-SLOT-{slot_id:04d}",
                "corridor_zone": z,
                "from_station_code": f_st,
                "to_station_code": t_st,
                "track_id": trk,
                "slot_type": "NIGHT_CORRIDOR_VALLEY",
                "start_time": s_t,
                "end_time": e_t,
                "available_duration_minutes": dur,
                "lead_train_before": t_bef,
                "following_train_after": t_aft,
                "train_delay_risk_level": rsk,
                "is_allocated": 0
            })
            slot_id += 1
            
        # 2. Midday Suburban Off-Peak Valleys (12:00 to 14:00)
        midday_slots = [
            ("ZONE_B_MS_TBM", "MS", "TBM", "LINE_3_MAIN_DN", f"{date_str} 12:10:00", f"{date_str} 13:50:00", 100, "EXP-20608-VANDEBHARAT", "EXP-12635-VAIGAI", "MEDIUM"),
            ("ZONE_C_TBM_CGL", "TBM", "CGL", "3RD_LINE_BIDIRECTIONAL", f"{date_str} 12:30:00", f"{date_str} 14:15:00", 105, "FREIGHT-BOXN-CGL", "EMU-4061-SUB", "MEDIUM"),
            ("ZONE_B_MS_TBM", "MS", "TBM", "LINE_4_MAIN_UP", f"{date_str} 12:00:00", f"{date_str} 13:40:00", 100, "EXP-16127-GURUVAYUR", "EXP-12606-PALLAVAN", "MEDIUM")
        ]
        
        for z, f_st, t_st, trk, s_t, e_t, dur, t_bef, t_aft, rsk in midday_slots:
            coa_slots.append({
                "block_slot_id": f"COA-SLOT-{slot_id:04d}",
                "corridor_zone": z,
                "from_station_code": f_st,
                "to_station_code": t_st,
                "track_id": trk,
                "slot_type": "MIDDAY_OFFPEAK_VALLEY",
                "start_time": s_t,
                "end_time": e_t,
                "available_duration_minutes": dur,
                "lead_train_before": t_bef,
                "following_train_after": t_aft,
                "train_delay_risk_level": rsk,
                "is_allocated": 0
            })
            slot_id += 1
            
        # 3. Sunday Mega Block Windows (Weekend only)
        if current_date.weekday() == 6:  # Sunday
            mega_slots = [
                ("ZONE_B_MS_TBM", "MS", "TBM", "LINE_1_SUBURBAN_DN", f"{date_str} 09:00:00", f"{date_str} 15:00:00", 360, "SPECIAL-EMU-SUN1", "SPECIAL-EMU-SUN2", "HIGH"),
                ("ZONE_C_TBM_CGL", "TBM", "CGL", "3RD_LINE_BIDIRECTIONAL", f"{date_str} 08:30:00", f"{date_str} 14:30:00", 360, "EXP-SUNDAY-SPL", "FREIGHT-AUTO-WKND", "HIGH"),
            ]
            for z, f_st, t_st, trk, s_t, e_t, dur, t_bef, t_aft, rsk in mega_slots:
                coa_slots.append({
                    "block_slot_id": f"COA-SLOT-{slot_id:04d}",
                    "corridor_zone": z,
                    "from_station_code": f_st,
                    "to_station_code": t_st,
                    "track_id": trk,
                    "slot_type": "SUNDAY_MEGA_BLOCK",
                    "start_time": s_t,
                    "end_time": e_t,
                    "available_duration_minutes": dur,
                    "lead_train_before": t_bef,
                    "following_train_after": t_aft,
                    "train_delay_risk_level": rsk,
                    "is_allocated": 0
                })
                slot_id += 1
                
    return pd.DataFrame(coa_slots)

# ----------------------------------------------------------------------
# 6. MAIN EXECUTION & FILE SAVING
# ----------------------------------------------------------------------
if __name__ == "__main__":
    print("[INFO] Generating TMS Track Management System Data...")
    df_tms = generate_tms_data(300)
    tms_path = os.path.join(DATA_DIR, "tms_track_defects.csv")
    df_tms.to_csv(tms_path, index=False)
    print(f"  -> Saved {len(df_tms)} track defect records: {tms_path}")

    print("[INFO] Generating SMMS Signalling Maintenance Data...")
    df_smms = generate_smms_data(250)
    smms_path = os.path.join(DATA_DIR, "smms_signal_defects.csv")
    df_smms.to_csv(smms_path, index=False)
    print(f"  -> Saved {len(df_smms)} signaling defect records: {smms_path}")

    print("[INFO] Generating TDMS Traction Distribution Data...")
    df_tdms = generate_tdms_data(220)
    tdms_path = os.path.join(DATA_DIR, "tdms_traction_defects.csv")
    df_tdms.to_csv(tdms_path, index=False)
    print(f"  -> Saved {len(df_tdms)} traction defect records: {tdms_path}")

    print("[INFO] Generating COA Corridor Timetables & Available Block Slots...")
    df_coa = generate_coa_corridor_windows()
    coa_path = os.path.join(DATA_DIR, "coa_timetable_corridor_blocks.csv")
    df_coa.to_csv(coa_path, index=False)
    print(f"  -> Saved {len(df_coa)} available block slots: {coa_path}")

    print("\n[SUCCESS] All 4 data silos (TMS, SMMS, TDMS, COA) generated cleanly for PS 26027!")
