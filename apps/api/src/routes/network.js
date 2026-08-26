const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const stationsResult = await pool.query(`
      SELECT
        code,
        name,
        station_type,
        latitude,
        longitude,
        platform_count
      FROM stations
      ORDER BY latitude ASC;
    `);

    const tracksResult = await pool.query(`
      SELECT
        id,
        name,
        status,
        traffic_level,
        capacity,
        from_station_code,
        to_station_code
      FROM track_sections
      ORDER BY id ASC;
    `);

    const summaryResult = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM maintenance_tasks WHERE status <> 'COMPLETED') AS pending_tasks,
        (SELECT COUNT(*) FROM incidents WHERE status <> 'RESOLVED') AS active_incidents,
        (SELECT COUNT(*) FROM block_windows WHERE availability_status = 'AVAILABLE') AS available_block_windows,
        (SELECT COUNT(*) FROM track_sections WHERE status = 'OPERATIONAL') AS operational_tracks;
    `);

    res.json({
      corridor: "Chengalpattu to Chennai Central",
      stations: stationsResult.rows,
      tracks: tracksResult.rows,
      summary: summaryResult.rows[0]
    });
  } catch (error) {
    console.error("Unable to fetch network:", error);
    res.status(500).json({ message: "Unable to fetch railway network" });
  }
});

module.exports = router;