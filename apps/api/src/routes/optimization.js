const express = require("express");
const pool = require("../db");
const { calculatePriority } = require("../optimization/priorityService");
const { generateBaseline } = require("../optimization/baselineScheduler");
const { optimizeSchedule, optimizeAndSavePlan } = require("../optimization/optimizerService");

const router = express.Router();

// Calculate priority check (POST /api/optimization/priority)
router.post("/priority", (req, res, next) => {
  try {
    const taskData = req.body;
    
    // We run calculation
    const result = calculatePriority(taskData);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
});

// Calculate independent baseline schedule (POST /api/optimization/baseline)
router.post("/baseline", async (req, res, next) => {
  try {
    const tasksRes = await pool.query(
      `SELECT * FROM maintenance_tasks WHERE status IN ('PENDING', 'PLANNED') ORDER BY due_date ASC`
    );
    const tasks = tasksRes.rows;

    if (tasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_PENDING_TASKS",
          message: "There are no pending tasks to evaluate in a baseline schedule."
        }
      });
    }

    const baseline = generateBaseline(tasks);
    res.json({
      success: true,
      ...baseline
    });
  } catch (error) {
    next(error);
  }
});

// Run coordinated optimizer and save plan (POST /api/optimization/optimize)
router.post("/optimize", async (req, res, next) => {
  try {
    // 1. Fetch pending tasks to verify if any exist
    const tasksRes = await pool.query(
      `SELECT * FROM maintenance_tasks WHERE status IN ('PENDING', 'PLANNED')`
    );
    if (tasksRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_PENDING_TASKS",
          message: "Cannot run optimization: No pending maintenance tasks found."
        }
      });
    }

    // 2. Fetch block windows to verify if any exist
    const windowsRes = await pool.query(
      `SELECT * FROM block_windows WHERE availability_status = 'AVAILABLE'`
    );
    if (windowsRes.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FEASIBLE_BLOCKS",
          message: "Cannot run optimization: No available track block windows exist in the database."
        }
      });
    }

    // 3. Run optimization
    const result = await optimizeAndSavePlan();

    // If no tasks were able to be scheduled (e.g. no windows fit their duration/deadline)
    if (result.tasksScheduled.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FEASIBLE_BLOCK_PLAN",
          message: "Optimization generated zero scheduled blocks. None of the pending tasks fit within the available block windows or deadlines."
        }
      });
    }

    res.json({
      success: true,
      planId: result.id,
      status: result.status,
      recommendedBlocks: result.recommendedBlocks,
      tasksScheduled: result.tasksScheduled,
      tasksUnscheduled: result.tasksUnscheduled,
      affectedTrains: result.affectedTrains,
      objectiveValue: result.objectiveValue,
      metrics: result.metrics,
      explanation: result.explanation
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

