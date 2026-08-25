const express = require("express");
const pool = require("../db");

const router = express.Router();

// Returns every track section with map-ready station data.
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ts.id,
        ts.name,
        ts.status,
        ts.traffic_level,
        ts.capacity,
        ts.from_station_code,
        ts.to_station_code,
        from_station.name AS from_station_name,
        from_station.latitude AS from_latitude,
        from_station.longitude AS from_longitude,
        to_station.name AS to_station_name,
        to_station.latitude AS to_latitude,
        to_station.longitude AS to_longitude,
        (
          SELECT COUNT(*)
          FROM maintenance_tasks mt
          WHERE mt.track_section_id = ts.id
            AND mt.status <> 'COMPLETED'
        ) AS pending_tasks,
        (
          SELECT COUNT(*)
          FROM incidents i
          WHERE i.track_section_id = ts.id
            AND i.status <> 'RESOLVED'
        ) AS active_incidents
      FROM track_sections ts
      JOIN stations from_station ON from_station.code = ts.from_station_code
      JOIN stations to_station ON to_station.code = ts.to_station_code
      ORDER BY from_station.latitude ASC;
    `);

    res.json({
      count: result.rows.length,
      tracks: result.rows
    });
  } catch (error) {
    console.error("Unable to fetch tracks:", error);
    res.status(500).json({ message: "Unable to fetch track sections" });
  }
});

// Returns one selected track section and its related work.
router.get("/:sectionId", async (req, res) => {
  try {
    const { sectionId } = req.params;

    const trackResult = await pool.query(
      `SELECT * FROM track_sections WHERE id = $1`,
      [sectionId]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ message: "Track section not found" });
    }

    const tasksResult = await pool.query(
      `
        SELECT * FROM maintenance_tasks
        WHERE track_section_id = $1
        ORDER BY
          CASE severity
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            ELSE 4
          END
      `,
      [sectionId]
    );

    const windowsResult = await pool.query(
      `
        SELECT * FROM block_windows
        WHERE track_section_id = $1
        ORDER BY start_time ASC
      `,
      [sectionId]
    );

    res.json({
      track: trackResult.rows[0],
      tasks: tasksResult.rows,
      availableWindows: windowsResult.rows
    });
  } catch (error) {
    console.error("Unable to fetch track details:", error);
    res.status(500).json({ message: "Unable to fetch track details" });
  }
});

module.exports = router;