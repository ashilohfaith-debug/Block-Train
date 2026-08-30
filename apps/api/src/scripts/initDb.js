require("dotenv").config();

const pool = require("../db");

/**
 * Initializes the RailTwin PostgreSQL database schema.
 * Recreates and defines all tables to handle tracks, stations,
 * maintenance tasks, block windows, optimization plans, trains,
 * incidents, advisories, and audit trails.
 */
const initializeDatabase = async () => {
  try {
    // Drop existing tables to ensure a clean schema mapping
    console.log("Dropping existing tables to initialize clean schema...");
    await pool.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS advisories CASCADE;
      DROP TABLE IF EXISTS plan_tasks CASCADE;
      DROP TABLE IF EXISTS plan_blocks CASCADE;
      DROP TABLE IF EXISTS plans CASCADE;
      DROP TABLE IF EXISTS incidents CASCADE;
      DROP TABLE IF EXISTS trains CASCADE;
      DROP TABLE IF EXISTS block_windows CASCADE;
      DROP TABLE IF EXISTS maintenance_tasks CASCADE;
      DROP TABLE IF EXISTS track_sections CASCADE;
      DROP TABLE IF EXISTS stations CASCADE;
      DROP TABLE IF EXISTS active_blocks CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log("Creating database tables...");
    await pool.query(`
      -- ---------------------------------------------------------------
      -- users
      -- Stores RailTwin system user accounts.
      -- password_hash: bcrypt-hashed password (plaintext NEVER stored).
      -- role:          ADMIN | CONTROLLER | ENGINEERING | SNT | TRACTION
      -- department:    For department staff, mirrors the role value.
      --                NULL for ADMIN and CONTROLLER.
      -- ---------------------------------------------------------------
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(30)  NOT NULL,
        department    VARCHAR(30),
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      -- Fast lookup by email during login
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

      CREATE TABLE IF NOT EXISTS stations (
        code VARCHAR(10) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        station_type VARCHAR(20) NOT NULL,
        latitude DECIMAL(9, 6) NOT NULL,
        longitude DECIMAL(9, 6) NOT NULL,
        platform_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS track_sections (
        id VARCHAR(30) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'OPERATIONAL',
        traffic_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        from_station_code VARCHAR(10) REFERENCES stations(code),
        to_station_code VARCHAR(10) REFERENCES stations(code),
        capacity INTEGER NOT NULL DEFAULT 2,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS maintenance_tasks (
        id SERIAL PRIMARY KEY,
        department VARCHAR(30) NOT NULL,
        task_type VARCHAR(50) NOT NULL,
        track_section_id VARCHAR(30) REFERENCES track_sections(id),
        asset VARCHAR(100),
        description TEXT NOT NULL,
        severity VARCHAR(20) NOT NULL,
        safety_criticality INTEGER DEFAULT 0,
        asset_impact INTEGER DEFAULT 0,
        failure_risk INTEGER DEFAULT 0,
        required_duration_minutes INTEGER NOT NULL,
        overdue_days INTEGER DEFAULT 0,
        deadline TIMESTAMP,
        due_date TIMESTAMP,
        requested_start TIMESTAMP,
        requested_end TIMESTAMP,
        priority_score DECIMAL(5, 2),
        priority_level VARCHAR(20),
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS block_windows (
        id SERIAL PRIMARY KEY,
        track_section_id VARCHAR(30) REFERENCES track_sections(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        availability_status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
        traffic_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        baseline_block_minutes INTEGER,
        optimized_block_minutes INTEGER,
        block_minutes_saved INTEGER,
        metrics JSONB,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plan_blocks (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
        track_section_id VARCHAR(30) REFERENCES track_sections(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        duration_minutes INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS plan_tasks (
        plan_block_id INTEGER REFERENCES plan_blocks(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
        PRIMARY KEY (plan_block_id, task_id)
      );

      CREATE TABLE IF NOT EXISTS trains (
        id VARCHAR(30) PRIMARY KEY,
        train_name VARCHAR(150) NOT NULL,
        train_type VARCHAR(50) NOT NULL,
        current_track_section_id VARCHAR(30) REFERENCES track_sections(id),
        scheduled_time TIMESTAMP,
        status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED'
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        track_section_id VARCHAR(30) REFERENCES track_sections(id),
        incident_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
        advisory TEXT,
        reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS advisories (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
        train_id VARCHAR(30) REFERENCES trains(id),
        action VARCHAR(30) NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS active_blocks (
        id VARCHAR(255) PRIMARY KEY,
        department VARCHAR(100) NOT NULL,
        block_date VARCHAR(20) NOT NULL,
        from_time VARCHAR(10) NOT NULL,
        to_time VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        actor VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        old_status VARCHAR(30),
        new_status VARCHAR(30),
        reason TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Database tables created successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  } finally {
    await pool.end();
  }
};

initializeDatabase();