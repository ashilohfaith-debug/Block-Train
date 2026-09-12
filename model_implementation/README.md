# Model Implementation & Railway Simulation Suite

This directory contains the mathematical research, dataset generator, database schema, and Google Colab datasets for the 26-station railway network simulation and Automatic Block Planning model.

## Directory Structure

```
model_implementation/
├── data/                                 # Generated datasets for ML training and Colab
│   ├── full_railway_simulation.xlsx      # Multi-sheet Excel workbook (Master + Children + Scenarios)
│   ├── stations.csv                      # Station master table (26 stations, 4 junctions)
│   ├── train_simulation_training.csv/tsv # Scenarios 1 to 5 (130 rows) for model training
│   ├── train_simulation_validation.csv/tsv # Scenarios 6 to 8 (78 rows) for validation
│   ├── train_simulation_all_scenarios.csv # All 8 scenarios (208 rows)
│   ├── signals_events.csv                # 48 timestamped signal events/day
│   ├── gate_openings.csv                 # 72 level crossing gate openings/day
│   ├── track_maintenance.csv             # Civil track tamping & cleaning blocks
│   ├── engineering_maintenance.csv       # Structural & bridge inspection blocks
│   ├── traction_maintenance.csv          # OHE electrical power blocks
│   └── accident_incidents.csv            # 3 simulated incidents/day (including Track Point 63)
├── database/                             # Database schema
│   └── schema_postgres.sql               # PostgreSQL DDL schema with relational foreign keys
├── scripts/                              # Execution scripts
│   └── simulate_railway_data.py          # Python simulation engine to regenerate all datasets
├── REAL_SOUTHERN_RAILWAY_CORRIDOR_DATA.md # Ground truth real Southern Railway corridor data
├── MILP_MAINTENANCE_SCHEDULING_RESEARCH.md # Core mathematical research for MILP scheduling
├── PROJECT_TASKS_AND_OVERVIEW.md         # Action items checklist & system specifications
└── README.md                             # This file
```

## Quick Start: Regenerating Data

To regenerate all simulation tables and the multi-sheet Excel workbook:

```bash
python model_implementation/scripts/simulate_railway_data.py
```
