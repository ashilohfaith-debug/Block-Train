-- ====================================================================
-- PostgreSQL Schema for BlockTrain Railway Network & Restricting Variables
-- 26 Stations Corridor (A to Z) with 4 Junctions & 5 Disruption Child Tables
-- ====================================================================

-- 1. Stations Master Table
CREATE TABLE IF NOT EXISTS stations (
    station_id SERIAL PRIMARY KEY,
    station_code VARCHAR(10) NOT NULL UNIQUE,       -- e.g. 'STA_A', 'STA_D'
    station_name VARCHAR(100) NOT NULL,             -- e.g. 'Station A (Chennai Beach)'
    is_junction BOOLEAN DEFAULT FALSE,              -- TRUE for 4 junctions (Egmore, Guindy, St. Thomas Mount, Tambaram)
    dwell_time_seconds INT NOT NULL,                -- 30s normal, 60s junction
    inter_station_distance_km NUMERIC(5, 2) NOT NULL, -- Distance from previous station
    distance_from_origin_km NUMERIC(6, 2) NOT NULL, -- Cumulative distance from Station A
    baseline_run_time_minutes NUMERIC(5, 2) NOT NULL -- Pure transit time without disruptions
);

-- 2. Child Table: Signal Events
-- Captures red/yellow signal holding events (~3 times/hour per busy section)
CREATE TABLE IF NOT EXISTS signals_events (
    event_id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    event_timestamp TIMESTAMP NOT NULL,
    signal_aspect VARCHAR(20) NOT NULL,             -- 'RED', 'YELLOW', 'DOUBLE_YELLOW', 'GREEN'
    delay_seconds INT NOT NULL DEFAULT 0,           -- Extra dwell caused by signal caution
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Child Table: Railway Gate Openings (Level Crossings)
-- Captures real Southern Railway LC gate openings (~2 times/hour across active corridor gates)
CREATE TABLE IF NOT EXISTS gate_openings (
    opening_id SERIAL PRIMARY KEY,
    gate_code VARCHAR(20) NOT NULL,                 -- e.g. 'LC-26', 'LC-33', 'LC-43'
    location_name VARCHAR(100),                     -- e.g. 'Chromepet (Radha Nagar)', 'Perungalathur'
    kilometer_marker NUMERIC(5, 2),                 -- e.g. 24.80, 32.20
    between_station_from INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    between_station_to INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    open_timestamp TIMESTAMP NOT NULL,
    close_timestamp TIMESTAMP NOT NULL,
    open_duration_seconds INT NOT NULL,             -- Typically 240s - 480s (4-8 mins)
    train_held BOOLEAN DEFAULT FALSE,
    delay_seconds INT NOT NULL DEFAULT 0
);

-- 4. Child Table: Track Maintenance (Civil / P-Way)
CREATE TABLE IF NOT EXISTS track_maintenance (
    block_id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    work_type VARCHAR(50) NOT NULL,                 -- 'TAMPING', 'BALLAST_CLEANING', 'WELD_TESTING'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    imposed_speed_restriction_kmh INT DEFAULT 30,   -- Speed restriction during/after block
    track_possession_granted BOOLEAN DEFAULT TRUE
);

-- 5. Child Table: Engineering Maintenance (Civil Structural)
CREATE TABLE IF NOT EXISTS engineering_maintenance (
    block_id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    work_type VARCHAR(50) NOT NULL,                 -- 'BRIDGE_GIRDER_INSPECTION', 'TURNOUT_OVERHAUL'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    track_possession_granted BOOLEAN DEFAULT TRUE
);

-- 6. Child Table: Traction Maintenance (Electrical / TRD)
CREATE TABLE IF NOT EXISTS traction_maintenance (
    block_id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    work_type VARCHAR(50) NOT NULL,                 -- 'OHE_INSPECTION', 'CABLE_RESTRINGING', 'ISOLATION'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    power_block_de_energized BOOLEAN DEFAULT TRUE
);

-- 7. Child Table: Accident & Incident Emergency Events
-- Simulates ~3 incidents/day with emergency team alerts
CREATE TABLE IF NOT EXISTS accident_incidents (
    incident_id SERIAL PRIMARY KEY,
    incident_timestamp TIMESTAMP NOT NULL,
    track_point_marker INT NOT NULL,                -- e.g. Track Point 63
    nearest_station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    severity_level VARCHAR(20) NOT NULL,            -- 'CRITICAL', 'HIGH', 'MEDIUM'
    alarm_triggered BOOLEAN DEFAULT TRUE,
    traction_dispatched BOOLEAN DEFAULT TRUE,
    signaling_dispatched BOOLEAN DEFAULT TRUE,
    engineering_dispatched BOOLEAN DEFAULT TRUE,
    estimated_clearing_delay_minutes INT NOT NULL
);

-- Indexes for lightning-fast lookups during simulation & dispatch queries
CREATE INDEX IF NOT EXISTS idx_signals_station ON signals_events(station_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_gates_timestamp ON gate_openings(open_timestamp);
CREATE INDEX IF NOT EXISTS idx_track_maint_time ON track_maintenance(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_traction_maint_time ON traction_maintenance(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_accidents_time ON accident_incidents(incident_timestamp);
