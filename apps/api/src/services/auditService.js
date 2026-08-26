const pool = require("../db");

/**
 * Creates an audit log entry in the database.
 * 
 * @param {string} actor - The user/entity performing the action (e.g. 'SYSTEM', 'CONTROLLER').
 * @param {string} action - The action type (e.g. 'TASK_CREATED', 'PLAN_APPROVED').
 * @param {string} entityType - The table name or model (e.g. 'maintenance_tasks', 'plans').
 * @param {string|number} entityId - The unique identifier of the entity.
 * @param {string|null} oldStatus - Previous state.
 * @param {string|null} newStatus - Current state.
 * @param {string|null} reason - Explanatory message.
 * @returns {Promise<Object>} The inserted audit log record.
 */
async function logAction(actor, action, entityType, entityId, oldStatus = null, newStatus = null, reason = null) {
  try {
    const result = await pool.query(
      `
        INSERT INTO audit_logs (actor, action, entity_type, entity_id, old_status, new_status, reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [actor || "SYSTEM", action, entityType, String(entityId), oldStatus, newStatus, reason]
    );
    console.log(`Audit log written: ${action} for ${entityType} ID ${entityId}`);
    return result.rows[0];
  } catch (error) {
    console.error("Failed to write audit log:", error);
    return null;
  }
}

module.exports = {
  logAction
};

