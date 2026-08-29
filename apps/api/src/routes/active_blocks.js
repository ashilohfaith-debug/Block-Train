const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all active blocks
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM active_blocks ORDER BY created_at DESC");
    
    // Filter out blocks that have expired
    const activeBlocks = result.rows;

    res.json({
      success: true,
      blocks: activeBlocks.map(row => ({
        id: row.id,
        department: row.department,
        date: row.block_date,
        fromTime: row.from_time,
        toTime: row.to_time
      }))
    });
  } catch (error) {
    next(error);
  }
});

// POST create a new block
router.post("/", async (req, res, next) => {
  try {
    const { id, department, date, fromTime, toTime } = req.body;
    
    if (!id || !department || !date || !fromTime || !toTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await pool.query(
      "INSERT INTO active_blocks (id, department, block_date, from_time, to_time) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [id, department, date, fromTime, toTime]
    );

    res.json({ success: true, block: result.rows[0] });
  } catch (error) {
    // If block exists, just return success true for idempotency in the UI
    if (error.code === '23505') {
       return res.json({ success: true, message: "Block already exists" });
    }
    next(error);
  }
});

// DELETE a block
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM active_blocks WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
