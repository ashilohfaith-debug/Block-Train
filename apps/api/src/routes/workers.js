const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all workers
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM workers ORDER BY id DESC");
    res.json({ workers: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch workers" });
  }
});

// POST a new worker
router.post("/", async (req, res) => {
  try {
    const { name, phone, department } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO workers (name, phone, department) VALUES ($1, $2, $3) RETURNING *",
      [name, phone, department]
    );
    res.json({ success: true, worker: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add worker" });
  }
});

module.exports = router;
