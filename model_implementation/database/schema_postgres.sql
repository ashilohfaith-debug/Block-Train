-- ====================================================================
-- PostgreSQL Schema for BlockTrain Railway Network & Restricting Variables
-- Southern Railway South Line (Chennai Beach MSB to Chengalpattu CGL)
-- 26 Stations Corridor with Complete Signals, Crossings & Switches Infrastructure
-- ====================================================================

-- 1. Stations Master Table
CREATE TABLE IF NOT EXISTS stations (
    station_id SERIAL PRIMARY KEY,
    station_code VARCHAR(10) NOT NULL UNIQUE,          -- 'MSB', 'MS', 'GDY', 'STM', 'TBM', 'CGL'
    station_letter_code VARCHAR(10) NOT NULL UNIQUE,    -- 'STA_A' to 'STA_Z'
    station_name VARCHAR(100) NOT NULL,                -- 'Chennai Beach', 'Tambaram', etc.
    is_junction BOOLEAN DEFAULT FALSE,                 -- TRUE for 4 junctions (MS, GDY, STM, TBM)
    num_platforms INT NOT NULL DEFAULT 2,              -- Real platform count (e.g. MSB: 10, MS: 11, TBM: 10, CGL: 8)
    dwell_time_seconds INT NOT NULL,                   -- 30s normal, 60s junction
    inter_station_distance_km NUMERIC(5, 2) NOT NULL,  -- Distance from previous station
    distance_from_origin_km NUMERIC(6, 2) NOT NULL,    -- Cumulative chainage from MSB (0.00 to 59.84 km)
    baseline_run_time_minutes NUMERIC(5, 2) NOT NULL,  -- Pure transit run time (total route ~119 mins)
    signals_to_next_station INT NOT NULL DEFAULT 0,    -- Exact count of signals to next station
    active_lcs_to_next_station INT NOT NULL DEFAULT 0, -- Count of level crossings to next station
    railroad_switches_count INT NOT NULL DEFAULT 0     -- Total switches / turnouts located at this station
);

-- 2. Railway Crossings Master (All 13 Level Crossings: LC-26 to LC-64)
CREATE TABLE IF NOT EXISTS railway_crossings_master (
    crossing_id SERIAL PRIMARY KEY,
    crossing_code VARCHAR(20) NOT NULL UNIQUE,         -- 'LC-26', 'LC-33', 'LC-47', 'LC-58', etc.
    chainage_km NUMERIC(6, 2) NOT NULL,                -- Exact kilometer post along corridor
    station_from_code VARCHAR(10) NOT NULL REFERENCES stations(station_code),
    station_to_code VARCHAR(10) NOT NULL REFERENCES stations(station_code),
    location_name VARCHAR(120) NOT NULL,               -- e.g. 'Radha Nagar, Chromepet', 'Perungalathur Gate'
    road_name VARCHAR(150),                            -- Crossing roadway / link road
    crossing_class VARCHAR(50) NOT NULL,               -- 'Special Class', 'A Class', 'B Class', 'C Class'
    gate_type VARCHAR(100) NOT NULL,                   -- 'Manned Interlocked Lifting Barrier', etc.
    operating_status VARCHAR(100) NOT NULL,            -- 'Active Interlocked', 'ROB Operational', etc.
    interlocked_signal_id VARCHAR(50),                 -- Semi-automatic gate signal (e.g. 'GATE-SIG-LC33')
    typical_tvu INT,                                   -- Train Vehicle Units census
    avg_closure_seconds INT DEFAULT 360
);

-- 3. Corridor Signals Master (Full inventory of 72 4-Aspect Signals across the route)
CREATE TABLE IF NOT EXISTS corridor_signals_master (
    signal_id VARCHAR(50) PRIMARY KEY,                 -- 'ABS-SIG-01', 'GATE-SIG-LC33', 'HOME-SIG-TBM'
    signal_name VARCHAR(150) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,                  -- 'AUTOMATIC_BLOCK', 'SEMI_AUTO_GATE', 'STATION_HOME', 'STATION_STARTER'
    aspects_count INT NOT NULL DEFAULT 4,              -- 4-Aspect Colour Light (MACLS)
    aspect_types VARCHAR(100) NOT NULL DEFAULT 'RED, YELLOW, DOUBLE_YELLOW, GREEN',
    chainage_km NUMERIC(6, 2) NOT NULL,                -- Exact chainage along corridor
    section_from_station_code VARCHAR(10) NOT NULL REFERENCES stations(station_code),
    section_to_station_code VARCHAR(10) NOT NULL REFERENCES stations(station_code),
    inter_station_sequence INT NOT NULL,               -- 1st, 2nd, 3rd signal in section
    interlocked_gate_code VARCHAR(20) DEFAULT 'NONE',  -- Interlocked LC code if semi-automatic gate signal
    normal_aspect VARCHAR(20) DEFAULT 'GREEN'
);

-- 4. Station Signal Counts (Section-by-section breakdown)
CREATE TABLE IF NOT EXISTS station_signal_counts (
    section_id INT PRIMARY KEY,
    from_station_code VARCHAR(10) NOT NULL REFERENCES stations(station_code),
    from_station_name VARCHAR(100) NOT NULL,
    to_station_code VARCHAR(10) NOT NULL REFERENCES stations(station_code),
    to_station_name VARCHAR(100) NOT NULL,
    section_length_km NUMERIC(5, 2) NOT NULL,
    total_signals_between INT NOT NULL,
    num_automatic_signals INT NOT NULL,
    num_gate_signals INT NOT NULL,
    num_home_signals INT NOT NULL,
    signal_ids_list TEXT NOT NULL,
    level_crossings_in_section VARCHAR(100) DEFAULT 'NONE',
    avg_signal_spacing_m NUMERIC(6, 1) NOT NULL
);

-- 5. Railroad Switches Master (Inventory of all 182 Points & Crossings)
CREATE TABLE IF NOT EXISTS railroad_switches_master (
    switch_id VARCHAR(50) PRIMARY KEY,                 -- e.g. 'SW-SP-63', 'SW-TBM-118', 'SW-NBK-41'
    switch_sequence_id INT NOT NULL,
    point_number VARCHAR(30) NOT NULL,                 -- e.g. 'Point 63', 'Point 118'
    station_code VARCHAR(10) NOT NULL REFERENCES stations(station_code),
    station_name VARCHAR(100) NOT NULL,
    chainage_km NUMERIC(6, 2) NOT NULL,
    switch_type VARCHAR(50) NOT NULL,                  -- 'CROSSOVER', 'TURNOUT_1_IN_12', 'TURNOUT_1_IN_8.5'
    turnout_angle VARCHAR(20) NOT NULL,                -- '1 in 12', '1 in 8.5'
    point_machine_type VARCHAR(100) NOT NULL,          -- 'Electric Point Machine (110V DC Rotary)'
    max_diverging_speed_kmh INT NOT NULL,              -- 30, 15, or 50 km/h
    connects_from_line VARCHAR(100) NOT NULL,
    connects_to_line VARCHAR(100) NOT NULL,
    normal_setting VARCHAR(20) DEFAULT 'NORMAL',
    interlocking_type VARCHAR(50) NOT NULL             -- 'ELECTRONIC_INTERLOCKING' or 'ROUTE_RELAY_INTERLOCKING'
);

-- 6. Station Switch Counts Table
CREATE TABLE IF NOT EXISTS station_switch_counts (
    station_code VARCHAR(10) PRIMARY KEY REFERENCES stations(station_code),
    station_name VARCHAR(100) NOT NULL,
    total_switches INT NOT NULL,
    num_crossovers INT NOT NULL,
    num_platform_turnouts INT NOT NULL,
    num_siding_turnouts INT NOT NULL,
    point_numbers_list TEXT NOT NULL,
    yard_layout_description TEXT NOT NULL
);

-- 7. Child Table: Signal Events
CREATE TABLE IF NOT EXISTS signals_events (
    event_id SERIAL PRIMARY KEY,
    signal_id VARCHAR(50) NOT NULL REFERENCES corridor_signals_master(signal_id) ON DELETE CASCADE,
    signal_name VARCHAR(150),
    signal_type VARCHAR(50),
    chainage_km NUMERIC(6, 2),
    section_from_station_code VARCHAR(10) NOT NULL,
    section_to_station_code VARCHAR(10) NOT NULL,
    event_timestamp TIMESTAMP NOT NULL,
    signal_aspect VARCHAR(20) NOT NULL,                -- 'RED', 'YELLOW', 'DOUBLE_YELLOW'
    delay_seconds INT NOT NULL DEFAULT 0,
    delay_minutes NUMERIC(5, 2) NOT NULL DEFAULT 0.00
);

-- 8. Child Table: Railway Gate Openings (Level Crossings)
CREATE TABLE IF NOT EXISTS gate_openings (
    opening_id SERIAL PRIMARY KEY,
    crossing_code VARCHAR(20) NOT NULL REFERENCES railway_crossings_master(crossing_code) ON DELETE CASCADE,
    location_name VARCHAR(120),
    chainage_km NUMERIC(6, 2),
    station_from_code VARCHAR(10) NOT NULL,
    station_to_code VARCHAR(10) NOT NULL,
    crossing_class VARCHAR(50),
    operating_status VARCHAR(100),
    open_timestamp TIMESTAMP NOT NULL,
    close_timestamp TIMESTAMP NOT NULL,
    open_duration_seconds INT NOT NULL,
    delay_impact_minutes NUMERIC(5, 2) NOT NULL
);

-- 9. Child Table: Track Maintenance (Civil / P-Way)
CREATE TABLE IF NOT EXISTS track_maintenance (
    block_id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    station_code VARCHAR(10) NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    work_type VARCHAR(50) NOT NULL,                    -- 'CSM_TAMPING_PACKING', 'BCM_BALLAST_CLEANING', 'USFD_RAIL_TESTING'
    equipment_used VARCHAR(100),                       -- e.g. 'Plasser & Theurer CSM 09-32'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    speed_restriction_kmh INT DEFAULT 30
);

-- 10. Child Table: Engineering Maintenance (Civil Structural)
CREATE TABLE IF NOT EXISTS engineering_maintenance (
    block_id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    station_code VARCHAR(10) NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    work_type VARCHAR(50) NOT NULL,                    -- 'TURNOUT_SWITCH_OVERHAUL', 'FOOT_OVER_BRIDGE_GIRDER_INSPECTION'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL
);

-- 11. Child Table: Traction Maintenance (Electrical / TRD)
CREATE TABLE IF NOT EXISTS traction_maintenance (
    block_id SERIAL PRIMARY KEY,
    station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    station_code VARCHAR(10) NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    work_type VARCHAR(50) NOT NULL,                    -- 'OHE_CONTACT_WIRE_ADJUSTMENT', 'CATENARY_INSULATOR_WASHING'
    equipment_used VARCHAR(100),                       -- e.g. '8-Wheeler Diesel-Electric Tower Wagon (DETW)'
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    power_block_de_energized BOOLEAN DEFAULT TRUE
);

-- 12. Child Table: Accident & Incident Emergency Events
CREATE TABLE IF NOT EXISTS accident_incidents (
    accident_id SERIAL PRIMARY KEY,
    incident_timestamp TIMESTAMP NOT NULL,
    track_point_marker INT NOT NULL,                   -- e.g. Point 63 at Saidapet, Point 118 at Tambaram
    nearest_station_id INT NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
    station_code VARCHAR(10) NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,               -- 'CRITICAL', 'HIGH'
    alarm_triggered BOOLEAN DEFAULT TRUE,
    traction_dispatched BOOLEAN DEFAULT TRUE,
    signaling_dispatched BOOLEAN DEFAULT TRUE,
    engineering_dispatched BOOLEAN DEFAULT TRUE,
    estimated_clearing_delay_minutes NUMERIC(5, 2) NOT NULL
);

-- Indexes for lightning-fast queries during simulation & machine learning retrieval
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(station_code);
CREATE INDEX IF NOT EXISTS idx_signals_chainage ON corridor_signals_master(chainage_km);
CREATE INDEX IF NOT EXISTS idx_signals_section ON corridor_signals_master(section_from_station_code, section_to_station_code);
CREATE INDEX IF NOT EXISTS idx_crossings_chainage ON railway_crossings_master(chainage_km);
CREATE INDEX IF NOT EXISTS idx_switches_station ON railroad_switches_master(station_code);
CREATE INDEX IF NOT EXISTS idx_switches_point ON railroad_switches_master(point_number);
CREATE INDEX IF NOT EXISTS idx_signals_events_ts ON signals_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_gates_open_ts ON gate_openings(open_timestamp);
CREATE INDEX IF NOT EXISTS idx_track_maint_time ON track_maintenance(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_traction_maint_time ON traction_maintenance(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_accidents_time ON accident_incidents(incident_timestamp);
