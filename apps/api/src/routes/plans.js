const express = require("express");
const pool = require('../core/db');
const { logAction } = require('../core/services/auditService');

const router = express.Router();

/**
 * Fetch and format plan blocks for a given time window.
 */
async function getPlansForInterval(days) {
  const startTime = new Date();
  const endTime = new Date();
  endTime.setDate(startTime.getDate() + days);

  const query = `
    SELECT
      pb.id AS block_id,
      pb.start_time,
      pb.end_time,
      pb.duration_minutes,
      p.status,
      ts.id AS track_section_id,
      ts.name AS track_section_name,
      mt.id AS task_id,
      mt.department,
      mt.task_type,
      mt.description,
      mt.severity,
      mt.priority_score,
      mt.priority_level
    FROM plan_blocks pb
    JOIN plans p ON p.id = pb.plan_id
    JOIN track_sections ts ON ts.id = pb.track_section_id
    LEFT JOIN plan_tasks pt ON pt.plan_block_id = pb.id
    LEFT JOIN maintenance_tasks mt ON mt.id = pt.task_id
    WHERE p.status IN ('APPROVED', 'RECOMMENDED')
      AND pb.start_time >= $1
      AND pb.start_time <= $2
    ORDER BY pb.start_time ASC, pb.id ASC
  `;

  const result = await pool.query(query, [startTime.toISOString(), endTime.toISOString()]);
  
  // Group results by block_id
  const blocksMap = {};
  result.rows.forEach(row => {
    const bId = row.block_id;
    if (!blocksMap[bId]) {
      const startD = new Date(row.start_time);
      const dateStr = startD.toISOString().split('T')[0];
      
      blocksMap[bId] = {
        date: dateStr,
        section: row.track_section_id,
        trackSectionName: row.track_section_name,
        departments: new Set(),
        tasks: [],
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration_minutes,
        status: row.status,
        maxPriorityScore: 0,
        priority: "LOW"
      };
    }

    if (row.task_id) {
      blocksMap[bId].departments.add(row.department);
      blocksMap[bId].tasks.push({
        id: row.task_id,
        department: row.department,
        taskType: row.task_type,
        description: row.description,
        severity: row.severity,
        priorityLevel: row.priority_level,
        priorityScore: Number(row.priority_score)
      });
      
      const score = Number(row.priority_score || 0);
      if (score > blocksMap[bId].maxPriorityScore) {
        blocksMap[bId].maxPriorityScore = score;
        blocksMap[bId].priority = row.priority_level;
      }
    }
  });

  return Object.values(blocksMap).map(b => ({
    ...b,
    departments: [...b.departments]
  }));
}

// GET /api/plans/weekly
router.get("/weekly", async (req, res, next) => {
  try {
    const plans = await getPlansForInterval(7);
    res.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/plans/monthly
router.get("/monthly", async (req, res, next) => {
  try {
    const plans = await getPlansForInterval(30);
    res.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/plans/comparison
router.get("/comparison", async (req, res, next) => {
  try {
    const latestPlanRes = await pool.query(
      "SELECT * FROM plans ORDER BY id DESC LIMIT 1"
    );

    if (latestPlanRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NO_PLANS_FOUND",
          message: "No scheduling plans exist in the database yet."
        }
      });
    }

    const plan = latestPlanRes.rows[0];
    res.json({
      success: true,
      planId: plan.id,
      status: plan.status,
      baselineBlockMinutes: plan.baseline_block_minutes,
      optimizedBlockMinutes: plan.optimized_block_minutes,
      blockMinutesSaved: plan.block_minutes_saved,
      metrics: plan.metrics,
      explanation: plan.explanation
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/plans/:id/approve
router.post("/:id/approve", async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify plan exists
    const planRes = await client.query("SELECT * FROM plans WHERE id = $1", [id]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PLAN_NOT_FOUND",
          message: `Plan with ID ${id} was not found.`
        }
      });
    }

    const plan = planRes.rows[0];

    // 2. Validate current status
    if (plan.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PLAN_STATE",
          message: "Cannot approve a plan that has already been rejected."
        }
      });
    }

    if (plan.status === "APPROVED") {
      await client.query("COMMIT");
      return res.json({
        success: true,
        message: "Plan is already approved",
        plan
      });
    }

    // 3. Update plan status
    const updatePlanRes = await client.query(
      "UPDATE plans SET status = 'APPROVED' WHERE id = $1 RETURNING *",
      [id]
    );
    const approvedPlan = updatePlanRes.rows[0];

    // 4. Update task statuses and block track sections
    // Get all tasks in this plan
    const tasksRes = await client.query(`
      SELECT pt.task_id, pb.track_section_id
      FROM plan_tasks pt
      JOIN plan_blocks pb ON pb.id = pt.plan_block_id
      WHERE pb.plan_id = $1
    `, [id]);

    const taskIds = tasksRes.rows.map(t => t.task_id);
    const sectionIds = [...new Set(tasksRes.rows.map(t => t.track_section_id))];

    if (taskIds.length > 0) {
      // Update tasks to ASSIGNED
      await client.query(
        "UPDATE maintenance_tasks SET status = 'ASSIGNED' WHERE id = ANY($1)",
        [taskIds]
      );
    }

    if (sectionIds.length > 0) {
      // Update track sections status to MAINTENANCE
      await client.query(
        "UPDATE track_sections SET status = 'MAINTENANCE' WHERE id = ANY($1)",
        [sectionIds]
      );
    }

    // 5. Log audit trail
    await logAction(
      "CONTROLLER",
      "PLAN_APPROVED",
      "plans",
      id,
      plan.status,
      "APPROVED",
      `Plan approved by operations controller. Tasks assigned and sections blocked.`
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Plan successfully approved",
      plan: approvedPlan
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

// POST /api/plans/:id/reject
router.post("/:id/reject", async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Verify plan exists
    const planRes = await client.query("SELECT * FROM plans WHERE id = $1", [id]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PLAN_NOT_FOUND",
          message: `Plan with ID ${id} was not found.`
        }
      });
    }

    const plan = planRes.rows[0];

    // 2. Validate current status
    if (plan.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PLAN_STATE",
          message: "Cannot reject a plan that has already been approved."
        }
      });
    }

    if (plan.status === "REJECTED") {
      await client.query("COMMIT");
      return res.json({
        success: true,
        message: "Plan is already rejected",
        plan
      });
    }

    // 3. Update plan status
    const updatePlanRes = await client.query(
      "UPDATE plans SET status = 'REJECTED' WHERE id = $1 RETURNING *",
      [id]
    );
    const rejectedPlan = updatePlanRes.rows[0];

    // 4. Revert task statuses back to PENDING so they can be re-optimized
    const tasksRes = await client.query(`
      SELECT pt.task_id
      FROM plan_tasks pt
      JOIN plan_blocks pb ON pb.id = pt.plan_block_id
      WHERE pb.plan_id = $1
    `, [id]);

    const taskIds = tasksRes.rows.map(t => t.task_id);

    if (taskIds.length > 0) {
      await client.query(
        "UPDATE maintenance_tasks SET status = 'PENDING' WHERE id = ANY($1)",
        [taskIds]
      );
    }

    // 5. Log audit trail
    await logAction(
      "CONTROLLER",
      "PLAN_REJECTED",
      "plans",
      id,
      plan.status,
      "REJECTED",
      `Plan rejected by operations controller. Scheduled tasks reset to PENDING.`
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Plan successfully rejected",
      plan: rejectedPlan
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;

