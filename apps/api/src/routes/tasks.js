const express = require("express");
const pool = require("../db");
const { calculatePriority } = require("../optimization/priorityService");
const { logAction } = require("../services/auditService");
const { requireOwnDepartment } = require("../middleware/rbac");

const router = express.Router();

// Every task operation is department-scoped unless the caller is privileged.
router.use(requireOwnDepartment);

// Get tasks. Supports filters: ?department=ENGINEERING&status=PENDING&severity=HIGH&section=TBM-CMP&overdue=true
router.get("/", async (req, res, next) => {
  try {
    const { status, severity, section, trackSection, priority, overdue } = req.query;
    const department = req.query.department || req.departmentFilter;

    const conditions = [];
    const values = [];

    if (department) {
      // Allow SNT or S&T interchangeably
      if (department.toUpperCase() === "SNT" || department.toUpperCase() === "S&T") {
        conditions.push(`(mt.department = 'SNT' OR mt.department = 'S&T')`);
      } else {
        values.push(department.toUpperCase());
        conditions.push(`mt.department = $${values.length}`);
      }
    }

    if (status) {
      values.push(status.toUpperCase());
      conditions.push(`mt.status = $${values.length}`);
    }

    if (severity) {
      values.push(severity.toUpperCase());
      conditions.push(`mt.severity = $${values.length}`);
    }

    const sec = section || trackSection;
    if (sec) {
      values.push(sec);
      conditions.push(`mt.track_section_id = $${values.length}`);
    }

    if (priority) {
      values.push(priority.toUpperCase());
      conditions.push(`mt.priority_level = $${values.length}`);
    }

    if (overdue === "true") {
      conditions.push(`mt.overdue_days > 0`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
        SELECT
          mt.*,
          ts.name AS track_section_name
        FROM maintenance_tasks mt
        JOIN track_sections ts ON ts.id = mt.track_section_id
        ${whereClause}
        ORDER BY mt.priority_score DESC, mt.due_date ASC, mt.created_at DESC
      `,
      values
    );

    res.json({
      success: true,
      count: result.rows.length,
      tasks: result.rows
    });
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
        SELECT mt.*, ts.name AS track_section_name
        FROM maintenance_tasks mt
        JOIN track_sections ts ON ts.id = mt.track_section_id
        WHERE mt.id = $1
          AND ($2::varchar IS NULL OR mt.department = $2 OR ($2 = 'SNT' AND mt.department = 'S&T'))
      `,
      [id, req.departmentFilter || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: `Maintenance task with ID ${id} was not found.`
        }
      });
    }

    res.json({
      success: true,
      task: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Create task
router.post("/", async (req, res, next) => {
  try {
    const {
      department,
      sectionId,
      trackSectionId,
      taskType,
      description,
      severity,
      safetyCriticality,
      assetImpact,
      failureRisk,
      durationMinutes,
      requiredDurationMinutes,
      overdueDays,
      deadline,
      dueDate,
      requestedStart,
      requestedEnd,
      asset
    } = req.body;

    // 1. Validation
    const deptUpper = (department || "").toUpperCase();
    const validDepts = ["ENGINEERING", "SNT", "S&T", "TRACTION"];
    if (!validDepts.includes(deptUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DEPARTMENT",
          message: "Department must be one of: ENGINEERING, SNT, S&T, TRACTION."
        }
      });
    }

    const sevUpper = (severity || "").toUpperCase();
    const validSeverities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    if (!validSeverities.includes(sevUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SEVERITY",
          message: "Severity must be one of: CRITICAL, HIGH, MEDIUM, LOW."
        }
      });
    }

    const tSecId = sectionId || trackSectionId;
    if (!tSecId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_SECTION",
          message: "Track section ID is required."
        }
      });
    }

    // Verify track section exists in database
    const sectionCheck = await pool.query("SELECT id FROM track_sections WHERE id = $1", [tSecId]);
    if (sectionCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SECTION_NOT_FOUND",
          message: `Track section ID ${tSecId} does not exist in the database.`
        }
      });
    }

    const duration = requiredDurationMinutes !== undefined ? requiredDurationMinutes : durationMinutes;
    if (duration === undefined || duration === null) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_DURATION",
          message: "Task duration is required."
        }
      });
    }

    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DURATION",
          message: "Task duration must be a positive number of minutes."
        }
      });
    }

    if (!taskType || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REQUIRED_FIELDS",
          message: "taskType and description are required."
        }
      });
    }

    // 2. Priority Calculation
    const normalizedTaskForPriority = {
      safetyCriticality,
      assetImpact,
      failureRisk,
      overdueDays,
      severity: sevUpper
    };
    const prioResult = calculatePriority(normalizedTaskForPriority);

    // 3. Database insert
    const insertRes = await pool.query(
      `
        INSERT INTO maintenance_tasks
          (
            department, task_type, track_section_id, asset, description, severity,
            safety_criticality, asset_impact, failure_risk, required_duration_minutes,
            overdue_days, deadline, requested_start, requested_end, priority_score, priority_level, status
          )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'PENDING')
        RETURNING *
      `,
      [
        deptUpper,
        taskType,
        tSecId,
        asset || null,
        description,
        sevUpper,
        prioResult.factors.safetyCriticality,
        prioResult.factors.assetImpact,
        prioResult.factors.failureRisk,
        durationNum,
        overdueDays || 0,
        deadline || dueDate || null,
        requestedStart || null,
        requestedEnd || null,
        prioResult.priorityScore,
        prioResult.priorityLevel
      ]
    );

    const savedTask = insertRes.rows[0];

    // 4. Log Audit Log
    await logAction(
      "SYSTEM",
      "TASK_CREATED",
      "maintenance_tasks",
      savedTask.id,
      null,
      "PENDING",
      `Task created for department ${deptUpper} on section ${tSecId}`
    );

    res.status(201).json({
      success: true,
      message: "Maintenance task created successfully",
      task: savedTask
    });
  } catch (error) {
    next(error);
  }
});

// Update task (PATCH /api/tasks/:id)
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get current task details
    const currentRes = await pool.query("SELECT * FROM maintenance_tasks WHERE id = $1", [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: `Maintenance task with ID ${id} was not found.`
        }
      });
    }

    const currentTask = currentRes.rows[0];

    // An ID-based update must still respect department ownership when no body
    // department was supplied to the generic middleware.
    if (req.departmentFilter && currentTask.department !== req.departmentFilter &&
        !(req.departmentFilter === "SNT" && currentTask.department === "S&T")) {
      return res.status(403).json({
        success: false,
        error: { code: "DEPARTMENT_MISMATCH", message: "You cannot modify another department's task." }
      });
    }

    // Read fields to update
    const {
      department,
      sectionId,
      trackSectionId,
      taskType,
      description,
      severity,
      safetyCriticality,
      assetImpact,
      failureRisk,
      durationMinutes,
      requiredDurationMinutes,
      overdueDays,
      deadline,
      dueDate,
      requestedStart,
      requestedEnd,
      asset,
      status
    } = req.body;

    // Validate if any fields are changing
    const deptUpper = department ? department.toUpperCase() : currentTask.department;
    if (department && !["ENGINEERING", "SNT", "S&T", "TRACTION"].includes(deptUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DEPARTMENT",
          message: "Department must be one of: ENGINEERING, SNT, S&T, TRACTION."
        }
      });
    }

    const sevUpper = severity ? severity.toUpperCase() : currentTask.severity;
    if (severity && !["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(sevUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SEVERITY",
          message: "Severity must be one of: CRITICAL, HIGH, MEDIUM, LOW."
        }
      });
    }

    const tSecId = sectionId || trackSectionId || currentTask.track_section_id;
    if (sectionId || trackSectionId) {
      const sectionCheck = await pool.query("SELECT id FROM track_sections WHERE id = $1", [tSecId]);
      if (sectionCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: "SECTION_NOT_FOUND",
            message: `Track section ID ${tSecId} does not exist.`
          }
        });
      }
    }

    const duration = requiredDurationMinutes !== undefined ? requiredDurationMinutes : durationMinutes;
    const durationNum = duration !== undefined ? Number(duration) : currentTask.required_duration_minutes;
    if (duration !== undefined && (isNaN(durationNum) || durationNum <= 0)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_DURATION",
          message: "Task duration must be a positive number."
        }
      });
    }

    const statusUpper = status ? status.toUpperCase() : currentTask.status;
    if (status && !["PENDING", "PLANNED", "ASSIGNED", "COMPLETED", "CANCELLED"].includes(statusUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Status must be: PENDING, PLANNED, ASSIGNED, COMPLETED, or CANCELLED."
        }
      });
    }

    // Recalculate Priority
    const safetyCrit = safetyCriticality !== undefined ? safetyCriticality : currentTask.safety_criticality;
    const assImpact = assetImpact !== undefined ? assetImpact : currentTask.asset_impact;
    const failRisk = failureRisk !== undefined ? failureRisk : currentTask.failure_risk;
    const ovDays = overdueDays !== undefined ? overdueDays : currentTask.overdue_days;

    const prioResult = calculatePriority({
      safetyCriticality: safetyCrit,
      assetImpact: assImpact,
      failureRisk: failRisk,
      overdueDays: ovDays,
      severity: sevUpper
    });

    // Update query
    const updateRes = await pool.query(
      `
        UPDATE maintenance_tasks
        SET
          department = $1, task_type = $2, track_section_id = $3, asset = $4,
          description = $5, severity = $6, safety_criticality = $7, asset_impact = $8,
          failure_risk = $9, required_duration_minutes = $10, overdue_days = $11,
          deadline = $12, requested_start = $13, requested_end = $14,
          priority_score = $15, priority_level = $16, status = $17
        WHERE id = $18
        RETURNING *
      `,
      [
        deptUpper,
        taskType !== undefined ? taskType : currentTask.task_type,
        tSecId,
        asset !== undefined ? asset : currentTask.asset,
        description !== undefined ? description : currentTask.description,
        sevUpper,
        prioResult.factors.safetyCriticality,
        prioResult.factors.assetImpact,
        prioResult.factors.failureRisk,
        durationNum,
        ovDays,
        deadline || dueDate || currentTask.deadline,
        requestedStart !== undefined ? requestedStart : currentTask.requested_start,
        requestedEnd !== undefined ? requestedEnd : currentTask.requested_end,
        prioResult.priorityScore,
        prioResult.priorityLevel,
        statusUpper,
        id
      ]
    );

    const updatedTask = updateRes.rows[0];

    // Audit log
    await logAction(
      "SYSTEM",
      "TASK_UPDATED",
      "maintenance_tasks",
      id,
      currentTask.status,
      statusUpper,
      `Task fields updated, priority re-calculated to ${prioResult.priorityScore}.`
    );

    res.json({
      success: true,
      message: "Maintenance task updated successfully",
      task: updatedTask
    });
  } catch (error) {
    next(error);
  }
});

// Update task status only (compatibility route)
router.patch("/:taskId/status", async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const statusUpper = (status || "").toUpperCase();
    const validStatuses = ["PENDING", "PLANNED", "ASSIGNED", "COMPLETED", "CANCELLED"];

    if (!validStatuses.includes(statusUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Status must be PENDING, PLANNED, ASSIGNED, COMPLETED, or CANCELLED."
        }
      });
    }

    const currentRes = await pool.query("SELECT status, department FROM maintenance_tasks WHERE id = $1", [taskId]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found."
        }
      });
    }

    const oldStatus = currentRes.rows[0].status;
    if (req.departmentFilter && currentRes.rows[0].department !== req.departmentFilter &&
        !(req.departmentFilter === "SNT" && currentRes.rows[0].department === "S&T")) {
      return res.status(403).json({
        success: false,
        error: { code: "DEPARTMENT_MISMATCH", message: "You cannot modify another department's task." }
      });
    }

    const result = await pool.query(
      `
        UPDATE maintenance_tasks
        SET status = $1
        WHERE id = $2
        RETURNING *
      `,
      [statusUpper, taskId]
    );

    await logAction(
      "SYSTEM",
      "TASK_STATUS_UPDATED",
      "maintenance_tasks",
      taskId,
      oldStatus,
      statusUpper,
      "Task workflow status updated."
    );

    res.json({
      success: true,
      message: "Task status updated",
      task: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const currentRes = await pool.query("SELECT status, department FROM maintenance_tasks WHERE id = $1", [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: `Maintenance task with ID ${id} was not found.`
        }
      });
    }

    const oldStatus = currentRes.rows[0].status;
    if (req.departmentFilter && currentRes.rows[0].department !== req.departmentFilter &&
        !(req.departmentFilter === "SNT" && currentRes.rows[0].department === "S&T")) {
      return res.status(403).json({
        success: false,
        error: { code: "DEPARTMENT_MISMATCH", message: "You cannot delete another department's task." }
      });
    }

    // We can delete or update to CANCELLED. The prompt says "Delete/cancel task". 
    // Let's delete it relationally but verify cascade.
    // Or we can just run a DELETE query.
    await pool.query("DELETE FROM maintenance_tasks WHERE id = $1", [id]);

    await logAction(
      "SYSTEM",
      "TASK_DELETED",
      "maintenance_tasks",
      id,
      oldStatus,
      "DELETED",
      "Maintenance task deleted from the database."
    );

    res.json({
      success: true,
      message: `Maintenance task ID ${id} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;