/**
 * ============================================================
 * src/ai/prompts.js  —  AI Prompt Templates for RailTwin
 * ============================================================
 *
 * PURPOSE
 * -------
 * All text that is sent to the Grok AI lives here, separated from
 * business logic.  This has several advantages:
 *
 *   1. A non-developer (e.g. a railway operations expert) can review
 *      and improve prompt wording without touching any logic code.
 *   2. Prompts can be version-controlled and their changes tracked.
 *   3. aiService.js stays clean — it only calls the builder functions
 *      here to get formatted prompt strings.
 *
 * STRUCTURE
 * ---------
 * Each AI "task" has two parts:
 *
 *   SYSTEM PROMPT   — permanent instructions that tell Grok what role
 *                     it is playing and what output format to use.
 *                     This is sent as { role: "system", content: ... }
 *
 *   USER PROMPT     — the actual data for this specific request,
 *                     built dynamically by a builder function.
 *                     This is sent as { role: "user", content: ... }
 *
 * THREE AI TASKS ARE DEFINED:
 *
 *   1. RISK ANALYSIS
 *      Given a maintenance task's attributes, classify the risk level
 *      as LOW / MEDIUM / HIGH / CRITICAL with a reason.
 *
 *   2. OPTIMIZATION EXPLANATION
 *      Given baseline vs optimised schedule metrics and block details,
 *      produce a human-readable summary of why the optimised plan is
 *      better and what savings it achieves.
 *
 *   3. RECOVERY ADVISORY
 *      Given an emergency incident and its generated train advisories
 *      (HOLD, DIVERSION, etc.), explain the recovery reasoning in
 *      plain language for operations staff.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. RISK ANALYSIS PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * System prompt for the risk analysis task.
 *
 * We explicitly instruct Grok to:
 *   - Act as a Senior Railway Risk Evaluator (gives the model useful context).
 *   - Return ONLY valid JSON (no markdown fences, no preamble).
 *   - Follow a strict schema so we can JSON.parse() the output reliably.
 */
const RISK_ANALYSIS_SYSTEM = `You are a Senior Railway Operations and Infrastructure Risk Evaluator.
Your job is to analyze a proposed maintenance task or reported defect, evaluate the risks, and return a structured analysis.
You MUST respond in valid JSON format. Do not include markdown wraps (like \`\`\`json) inside the JSON string itself.
Response Schema:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reason": "Clear explanation of the safety or operational risk",
  "confidence": 0.0 to 1.0,
  "factors": ["factor 1", "factor 2"]
}`;

/**
 * Builds the user-role prompt for a risk analysis request.
 *
 * All task fields are injected as plain text so Grok can read them.
 * Numeric scores (safetyCriticality, etc.) are included so Grok can
 * use them alongside the textual description.
 *
 * @param {Object} task - Maintenance task object from the database or request body.
 * @returns {string} Formatted user prompt.
 */
function buildRiskAnalysisPrompt(task) {
  return `Please evaluate the risk profile for the following railway maintenance task:
Department: ${task.department}
Task Type: ${task.taskType || task.task_type}
Section: ${task.trackSectionId || task.track_section_id}
Asset: ${task.asset || 'General'}
Description: ${task.description}
Severity: ${task.severity}
Safety Criticality: ${task.safetyCriticality || task.safety_criticality || 50}
Asset Impact: ${task.assetImpact || task.asset_impact || 50}
Failure Risk: ${task.failureRisk || task.failure_risk || 50}
Overdue Days: ${task.overdueDays || task.overdue_days || 0}
Deadline: ${task.deadline || task.due_date || 'N/A'}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. OPTIMIZATION EXPLANATION PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * System prompt for the optimization explanation task.
 *
 * The model acts as a Railway Dispatch Planner who understands
 * block planning terminology.  The JSON schema ensures the response
 * can be parsed and embedded directly in API responses.
 */
const OPTIMIZATION_EXPLANATION_SYSTEM = `You are an expert Coordinated Railway Dispatch Planner.
Explain the schedule optimization comparison between independent department plans (baseline) and coordinated plans (optimized).
Describe the block time savings, train delays saved, task execution, and departmental coordination benefits in a professional, clear, operations-ready advisory.
Return a structured JSON format:
{
  "summary": "Brief natural-language executive summary of the savings",
  "reasons": ["benefit 1", "benefit 2", "benefit 3"],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}`;

/**
 * Builds the user-role prompt for an optimization explanation request.
 *
 * Includes all relevant KPIs from the optimization run and the full
 * list of scheduled blocks so Grok has complete context.
 *
 * @param {Object} baselineRes  - Baseline scheduler output (currently unused directly in text but passed for context).
 * @param {Object} optimizedRes - Optimizer output including recommendedBlocks array.
 * @param {Object} metrics      - Calculated KPIs from metricsService.js.
 * @returns {string} Formatted user prompt.
 */
function buildOptimizationExplanationPrompt(baselineRes, optimizedRes, metrics) {
  return `Optimization run results:
Baseline cumulative block time: ${metrics.baselineBlockMinutes} minutes (uncoordinated independent planning)
Optimized cumulative block time: ${metrics.optimizedBlockMinutes} minutes (coordinated planning)
Coordinated minutes saved: ${metrics.blockMinutesSaved} minutes
Coordination count (shared windows): ${metrics.coordinationCount}
Tasks scheduled: ${metrics.tasksCompleted} of ${metrics.tasksCompleted + (optimizedRes.tasksUnscheduled ? optimizedRes.tasksUnscheduled.length : 0)}
Critical tasks scheduled: ${metrics.criticalTasksCompleted}
Overdue tasks resolved: ${metrics.overdueTasksCleared}
Trains affected: ${metrics.affectedTrainPaths} (Estimated delay: ${metrics.estimatedDelayMinutes} mins)
Asset Availability: ${metrics.assetAvailability}%

Details of scheduled blocks:
${JSON.stringify(optimizedRes.recommendedBlocks, null, 2)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RECOVERY ADVISORY PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * System prompt for the recovery advisory task.
 *
 * The model acts as the Chief Emergency Railway Controller —
 * the highest authority in the corridor during an emergency.
 * The JSON schema allows callers to extract the risk level and
 * recommendation text cleanly.
 */
const RECOVERY_ADVISORY_SYSTEM = `You are the chief Emergency Railway Controller.
You need to explain the recovery action and delay mitigation strategy for an incident and its generated train operational advisories (such as HOLD, DIVERSION, SPEED_RESTRICTION, RESCHEDULE).
Summarize why these decisions are safe, how they prevent corridor congestion, and what operations need to expect.
Return a structured JSON format:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendation": "Executive directive summarizing actions",
  "reason": "Detailed explanation of why these recovery actions were chosen",
  "confidence": 0.0 to 1.0,
  "factors": ["incident severity", "train traffic delay minimization", "alternative paths"]
}`;

/**
 * Builds the user-role prompt for a recovery advisory explanation.
 *
 * The incident details, affected trains, and already-generated
 * advisories are all provided so Grok can explain them in context.
 *
 * @param {Object} incident       - Incident record from the database.
 * @param {Array}  affectedTrains - Trains running on the blocked section.
 * @param {Array}  advisories     - Deterministic advisories generated by incidents.js.
 * @returns {string} Formatted user prompt.
 */
function buildRecoveryAdvisoryPrompt(incident, affectedTrains, advisories) {
  return `Incident Details:
Section: ${incident.track_section_id || incident.sectionId}
Type: ${incident.incident_type || incident.type}
Severity: ${incident.severity}
Description: ${incident.description}

Affected Trains:
${JSON.stringify(affectedTrains, null, 2)}

Suggested Operational Advisories:
${JSON.stringify(advisories, null, 2)}`;
}

module.exports = {
  RISK_ANALYSIS_SYSTEM,
  buildRiskAnalysisPrompt,
  OPTIMIZATION_EXPLANATION_SYSTEM,
  buildOptimizationExplanationPrompt,
  RECOVERY_ADVISORY_SYSTEM,
  buildRecoveryAdvisoryPrompt
};
