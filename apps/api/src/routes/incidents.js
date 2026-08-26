const express = require("express");
const pool = require("../db");
const { logAction } = require("../services/auditService");
const { optimizeAndSavePlan } = require("../optimization/optimizerService");
const { explainRecovery } = require("../ai/aiService");

const router = express.Router();

// POST /api/incidents
router.post("/", async (req, res, next) => {
  const { sectionId, type, severity, description } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Validation
    if (!sectionId || !type || !severity || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_REQUIRED_FIELDS",
          message: "sectionId, type, severity, and description are required."
        }
      });
    }

    const validSeverities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    if (!validSeverities.includes(severity.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SEVERITY",
          message: "Severity must be one of: CRITICAL, HIGH, MEDIUM, LOW."
        }
      });
    }

    // Verify track section exists
    const sectionCheck = await pool.query("SELECT id FROM track_sections WHERE id = $1", [sectionId]);
    if (sectionCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "SECTION_NOT_FOUND",
          message: `Track section ID ${sectionId} does not exist.`
        }
      });
    }

    // 2. Insert incident
    const incidentRes = await client.query(
      `
        INSERT INTO incidents (track_section_id, incident_type, severity, description, status)
        VALUES ($1, $2, $3, $4, 'REPORTED')
        RETURNING *
      `,
      [sectionId, type, severity.toUpperCase(), description]
    );
    const incident = incidentRes.rows[0];

    // 3. Mark track section status affected
    const newTrackStatus = severity.toUpperCase() === "CRITICAL" ? "BLOCKED" : "RESTRICTED";
    await client.query(
      "UPDATE track_sections SET status = $1 WHERE id = $2",
      [newTrackStatus, sectionId]
    );

    // 4. Find affected trains (scheduled to run on this section)
    const trainsRes = await client.query(
      "SELECT * FROM trains WHERE current_track_section_id = $1 AND status = 'SCHEDULED'",
      [sectionId]
    );
    const affectedTrains = trainsRes.rows;

    // 5. Invalidate affected plan blocks and reset plan statuses to CANCELLED
    // Find plans containing blocks on this section
    const affectedPlansRes = await client.query(
      `
        SELECT DISTINCT pb.plan_id
        FROM plan_blocks pb
        JOIN plans p ON p.id = pb.plan_id
        WHERE pb.track_section_id = $1 AND p.status IN ('RECOMMENDED', 'APPROVED')
      `,
      [sectionId]
    );
    
    const affectedPlanIds = affectedPlansRes.rows.map(row => row.plan_id);
    
    if (affectedPlanIds.length > 0) {
      // Revert all tasks in these plans to PENDING
      await client.query(
        `
          UPDATE maintenance_tasks
          SET status = 'PENDING'
          WHERE id IN (
            SELECT pt.task_id
            FROM plan_tasks pt
            JOIN plan_blocks pb ON pb.id = pt.plan_block_id
            WHERE pb.plan_id = ANY($1)
          )
        `,
        [affectedPlanIds]
      );

      // Cancel the plans
      await client.query(
        "UPDATE plans SET status = 'CANCELLED' WHERE id = ANY($1)",
        [affectedPlanIds]
      );
      
      for (const pId of affectedPlanIds) {
        await logAction(
          "SYSTEM",
          "PLAN_INVALIDATED",
          "plans",
          pId,
          "RECOMMENDED/APPROVED",
          "CANCELLED",
          `Plan invalidated due to emergency incident ID ${incident.id} on section ${sectionId}.`
        );
      }
    }

    // Mark block windows on this section as unavailable during the emergency
    await client.query(
      "UPDATE block_windows SET availability_status = 'UNAVAILABLE' WHERE track_section_id = $1",
      [sectionId]
    );

    // 6. Generate simulated operational advisories for affected trains
    const advisories = [];
    for (let i = 0; i < affectedTrains.length; i++) {
      const train = affectedTrains[i];
      let action = "HOLD";
      let reason = `Emergency block: Critical defect on section ${sectionId}.`;

      if (severity.toUpperCase() === "CRITICAL") {
        // Express trains can be diverted, passenger/freight are held
        if (train.train_type === "EXPRESS") {
          action = "DIVERSION";
          reason = `Critical defect on ${sectionId}. Rerouting express train via alternative corridor line.`;
        } else {
          action = "HOLD";
          reason = `Critical defect on ${sectionId}. Holding train at preceding station platform.`;
        }
      } else {
        action = "SPEED_RESTRICTION";
        reason = `Moderate defect on ${sectionId}. Apply speed restriction of 30 km/h.`;
      }

      const advRes = await client.query(
        `
          INSERT INTO advisories (incident_id, train_id, action, reason)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `,
        [incident.id, train.id, action, reason]
      );
      
      advisories.push({
        trainId: train.id,
        action,
        reason
      });
    }

    // 7. Call Grok to generate recovery explanation and update incident advisory field
    const grokExplanation = await explainRecovery(incident, advisories);
    await client.query(
      "UPDATE incidents SET advisory = $1 WHERE id = $2",
      [grokExplanation, incident.id]
    );

    // 8. Log incident audit trail
    await logAction(
      "SYSTEM",
      "INCIDENT_CREATED",
      "incidents",
      incident.id,
      null,
      "REPORTED",
      `Emergency incident reported on section ${sectionId}. Track status updated to ${newTrackStatus}.`
    );

    await client.query("COMMIT");

    // 9. Re-optimize the schedule asynchronously/separately for other pending tasks (optional trigger, let's trigger it in transaction or log it)
    console.log("Triggering dynamic re-optimization after incident...");
    let reoptimizedPlanId = null;
    try {
      const reopt = await optimizeAndSavePlan();
      reoptimizedPlanId = reopt.id;
    } catch (reoptErr) {
      console.warn("Re-optimization after incident resulted in zero blocks or failed: ", reoptErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Emergency incident reported and operational advisories generated",
      incident: {
        ...incident,
        advisory: grokExplanation
      },
      trackStatus: newTrackStatus,
      affectedTrainsCount: affectedTrains.length,
      affectedPlansCount: affectedPlanIds.length,
      reoptimizedPlanId,
      advisories,
      simulationOnly: true,
      requiresControllerApproval: true
    });

  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

// GET /api/incidents/:id/impact
router.get("/:id/impact", async (req, res, next) => {
  try {
    const { id } = req.params;

    const incidentRes = await pool.query("SELECT * FROM incidents WHERE id = $1", [id]);
    if (incidentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "INCIDENT_NOT_FOUND",
          message: `Incident with ID ${id} was not found.`
        }
      });
    }

    const incident = incidentRes.rows[0];
    const sectionId = incident.track_section_id;

    // Fetch affected trains
    const trainsRes = await pool.query(
      "SELECT * FROM trains WHERE current_track_section_id = $1",
      [sectionId]
    );
    const affectedTrains = trainsRes.rows;

    // Estimate delays
    let estimatedDelays = 0;
    affectedTrains.forEach(t => {
      if (t.train_type === "EXPRESS") estimatedDelays += 25;
      else if (t.train_type === "PASSENGER") estimatedDelays += 15;
      else estimatedDelays += 10;
    });

    // Fetch affected plan IDs (cancelled plans on this section)
    const plansRes = await pool.query(
      `
        SELECT DISTINCT pb.plan_id, p.status, p.baseline_block_minutes, p.optimized_block_minutes
        FROM plan_blocks pb
        JOIN plans p ON p.id = pb.plan_id
        WHERE pb.track_section_id = $1
      `,
      [sectionId]
    );

    res.json({
      success: true,
      incidentId: incident.id,
      sectionId,
      severity: incident.severity,
      affectedTrains: affectedTrains.map(t => ({
        trainId: t.id,
        trainName: t.train_name,
        trainType: t.train_type
      })),
      affectedSections: [sectionId],
      estimatedDelays,
      affectedPlans: plansRes.rows
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/incidents/:id/advisory
router.get("/:id/advisory", async (req, res, next) => {
  try {
    const { id } = req.params;

    const incidentRes = await pool.query("SELECT * FROM incidents WHERE id = $1", [id]);
    if (incidentRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "INCIDENT_NOT_FOUND",
          message: `Incident with ID ${id} was not found.`
        }
      });
    }

    const incident = incidentRes.rows[0];

    const advisoriesRes = await pool.query(
      `
        SELECT a.train_id, a.action, a.reason
        FROM advisories a
        WHERE a.incident_id = $1
      `,
      [id]
    );

    res.json({
      success: true,
      incidentId: incident.id,
      sectionId: incident.track_section_id,
      advisories: advisoriesRes.rows.map(adv => ({
        trainId: adv.train_id,
        action: adv.action,
        reason: adv.reason
      })),
      simulationOnly: true,
      requiresControllerApproval: true
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

