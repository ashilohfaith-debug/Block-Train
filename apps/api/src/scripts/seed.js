require("dotenv").config();

const pool = require("../db");

const stations = [
  { code: "CGL", name: "Chengalpattu Junction", type: "MAJOR", lat: 12.6934, lng: 79.9756, platforms: 8 },
  { code: "SKL", name: "Singaperumal Koil", type: "MINOR", lat: 12.7600, lng: 80.0040, platforms: 5 },
  { code: "MMNK", name: "Maraimalai Nagar", type: "MINOR", lat: 12.7904, lng: 80.0223, platforms: 3 },
  { code: "GI", name: "Guduvancheri", type: "MINOR", lat: 12.8398, lng: 80.0601, platforms: 4 },
  { code: "VDR", name: "Vandalur", type: "MINOR", lat: 12.8931, lng: 80.0864, platforms: 3 },
  { code: "PRGL", name: "Perungalathur", type: "MINOR", lat: 12.9056, lng: 80.0950, platforms: 3 },
  { code: "TBM", name: "Tambaram", type: "MAJOR", lat: 12.9249, lng: 80.1100, platforms: 9 },
  { code: "CMP", name: "Chromepet", type: "MINOR", lat: 12.9525, lng: 80.1416, platforms: 4 },
  { code: "PV", name: "Pallavaram", type: "MINOR", lat: 12.9691, lng: 80.1481, platforms: 5 },
  { code: "STM", name: "St. Thomas Mount", type: "MINOR", lat: 12.9944, lng: 80.1989, platforms: 5 },
  { code: "GDY", name: "Guindy", type: "MAJOR", lat: 13.0076, lng: 80.2115, platforms: 4 },
  { code: "MBM", name: "Mambalam", type: "MINOR", lat: 13.0401, lng: 80.2312, platforms: 4 },
  { code: "NBK", name: "Nungambakkam", type: "MINOR", lat: 13.0617, lng: 80.2452, platforms: 4 },
  { code: "MS", name: "Chennai Egmore", type: "MAJOR", lat: 13.0784, lng: 80.2610, platforms: 11 },
  { code: "MAS", name: "Chennai Central", type: "MAJOR", lat: 13.0827, lng: 80.2707, platforms: 17 }
];

const trafficLevelFor = (fromCode) => {
  if (["TBM", "CMP", "PV", "STM", "GDY"].includes(fromCode)) return "HIGH";
  if (["CGL", "SKL", "MMNK", "GI", "MBM", "NBK"].includes(fromCode)) return "MEDIUM";
  return "LOW";
};

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Clear existing data
    await client.query(`
      TRUNCATE TABLE
        audit_logs,
        advisories,
        plan_tasks,
        plan_blocks,
        plans,
        incidents,
        maintenance_tasks,
        block_windows,
        trains,
        track_sections,
        stations
      RESTART IDENTITY;
    `);

    // Insert stations
    for (const station of stations) {
      await client.query(
        `
          INSERT INTO stations
            (code, name, station_type, latitude, longitude, platform_count)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          station.code,
          station.name,
          station.type,
          station.lat,
          station.lng,
          station.platforms
        ]
      );
    }

    // Generate consecutive sections between stations
    for (let index = 0; index < stations.length - 1; index += 1) {
      const from = stations[index];
      const to = stations[index + 1];
      const sectionId = `${from.code}-${to.code}`;
      const capacity = Math.max(2, Math.min(from.platforms, to.platforms));

      await client.query(
        `
          INSERT INTO track_sections
            (
              id,
              name,
              status,
              traffic_level,
              from_station_code,
              to_station_code,
              capacity
            )
          VALUES ($1, $2, 'OPERATIONAL', $3, $4, $5, $6)
        `,
        [
          sectionId,
          `${from.name} - ${to.name}`,
          trafficLevelFor(from.code),
          from.code,
          to.code,
          capacity
        ]
      );
    }

    // Explicitly add TBM-GDY section to support the specific Postman / demo workflow
    console.log("Seeding custom TBM-GDY section...");
    await client.query(
      `
        INSERT INTO track_sections
          (
            id,
            name,
            status,
            traffic_level,
            from_station_code,
            to_station_code,
            capacity
          )
        VALUES ('TBM-GDY', 'Tambaram - Guindy Corridor Section', 'OPERATIONAL', 'HIGH', 'TBM', 'GDY', 4)
      `
    );

    // Insert maintenance tasks with priority fields
    console.log("Seeding maintenance tasks with priority scores...");
    await client.query(`
      INSERT INTO maintenance_tasks
        (
          department,
          task_type,
          track_section_id,
          asset,
          description,
          severity,
          safety_criticality,
          asset_impact,
          failure_risk,
          required_duration_minutes,
          overdue_days,
          deadline,
          requested_start,
          requested_end,
          priority_score,
          priority_level,
          status
        )
      VALUES
        (
          'ENGINEERING',
          'Track Alignment Repair',
          'TBM-CMP',
          'Track 1',
          'Rail alignment correction between Tambaram and Chromepet',
          'HIGH',
          90,
          85,
          80,
          90,
          3,
          '2026-08-23 18:00:00',
          '2026-08-23 10:00:00',
          '2026-08-23 11:30:00',
          81.90,
          'HIGH',
          'PENDING'
        ),
        (
          'SNT',
          'Signal Circuit Inspection',
          'TBM-CMP',
          'Signal A1',
          'Signal circuit inspection near Tambaram approach',
          'HIGH',
          80,
          75,
          70,
          45,
          2,
          '2026-08-23 20:00:00',
          '2026-08-23 14:00:00',
          '2026-08-23 14:45:00',
          71.30,
          'HIGH',
          'PENDING'
        ),
        (
          'TRACTION',
          'OHE Maintenance',
          'TBM-CMP',
          'OHE Line 1',
          'Overhead equipment inspection and corrective maintenance',
          'MEDIUM',
          78,
          80,
          65,
          60,
          1,
          '2026-08-23 21:00:00',
          '2026-08-23 14:00:00',
          '2026-08-23 15:00:00',
          68.10,
          'MEDIUM',
          'PENDING'
        ),
        (
          'ENGINEERING',
          'Routine Track Inspection',
          'CGL-SKL',
          'Track 2',
          'Scheduled routine rail inspection',
          'MEDIUM',
          60,
          50,
          50,
          30,
          0,
          '2026-08-25 12:00:00',
          '2026-08-24 13:00:00',
          '2026-08-24 13:30:00',
          48.50,
          'LOW',
          'PENDING'
        ),
        (
          'SNT',
          'Telecommunication Check',
          'GDY-MBM',
          'Telecom Hub 2',
          'Communication equipment health check',
          'LOW',
          40,
          40,
          30,
          30,
          0,
          '2026-08-26 12:00:00',
          '2026-08-24 15:00:00',
          '2026-08-24 15:30:00',
          34.50,
          'LOW',
          'PENDING'
        ),
        (
          'TRACTION',
          'Power Supply Inspection',
          'NBK-MS',
          'Substation 3',
          'Traction power-supply inspection',
          'MEDIUM',
          65,
          60,
          55,
          45,
          0,
          '2026-08-26 18:00:00',
          '2026-08-24 22:00:00',
          '2026-08-24 22:45:00',
          53.00,
          'MEDIUM',
          'PENDING'
        );
    `);

    // Candidate block windows
    console.log("Seeding block windows...");
    await client.query(`
      INSERT INTO block_windows
        (
          track_section_id,
          start_time,
          end_time,
          availability_status,
          traffic_level
        )
      VALUES
        ('TBM-CMP', '2026-08-23 10:00:00', '2026-08-23 11:30:00', 'AVAILABLE', 'HIGH'),
        ('TBM-CMP', '2026-08-23 14:00:00', '2026-08-23 15:30:00', 'AVAILABLE', 'LOW'),
        ('TBM-CMP', '2026-08-23 22:00:00', '2026-08-23 23:30:00', 'AVAILABLE', 'MEDIUM'),
        ('CGL-SKL', '2026-08-24 13:00:00', '2026-08-24 14:00:00', 'AVAILABLE', 'LOW'),
        ('GDY-MBM', '2026-08-24 15:00:00', '2026-08-24 16:00:00', 'AVAILABLE', 'MEDIUM'),
        ('NBK-MS', '2026-08-24 22:00:00', '2026-08-24 23:00:00', 'AVAILABLE', 'LOW'),
        ('TBM-GDY', '2026-08-23 14:00:00', '2026-08-23 16:00:00', 'AVAILABLE', 'LOW'),
        ('TBM-GDY', '2026-08-23 20:00:00', '2026-08-23 22:00:00', 'AVAILABLE', 'MEDIUM');
    `);

    // Insert trains
    console.log("Seeding trains...");
    await client.query(`
      INSERT INTO trains
        (
          id,
          train_name,
          train_type,
          current_track_section_id,
          scheduled_time,
          status
        )
      VALUES
        ('T104', 'Chennai Express', 'EXPRESS', 'TBM-CMP', '2026-08-23 14:15:00', 'SCHEDULED'),
        ('T207', 'Tambaram Passenger', 'PASSENGER', 'TBM-CMP', '2026-08-23 14:30:00', 'SCHEDULED'),
        ('F09', 'Southern Freight', 'FREIGHT', 'TBM-CMP', '2026-08-23 14:45:00', 'SCHEDULED'),
        ('T301', 'Chengalpattu Local', 'PASSENGER', 'CGL-SKL', '2026-08-24 13:15:00', 'SCHEDULED'),
        ('T408', 'Central Fast Passenger', 'PASSENGER', 'NBK-MS', '2026-08-24 22:20:00', 'SCHEDULED'),
        ('T501', 'Coromandel Express', 'EXPRESS', 'TBM-GDY', '2026-08-23 14:30:00', 'SCHEDULED'),
        ('T502', 'Nellai Passenger', 'PASSENGER', 'TBM-GDY', '2026-08-23 15:10:00', 'SCHEDULED');
    `);

    await client.query("COMMIT");
    console.log("Railway corridor demo data seeded successfully, including TBM-GDY.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seeding failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase();