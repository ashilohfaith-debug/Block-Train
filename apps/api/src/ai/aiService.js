const { sendChatCompletion } = require("./grokClient");
const {
  RISK_ANALYSIS_SYSTEM,
  buildRiskAnalysisPrompt,
  OPTIMIZATION_EXPLANATION_SYSTEM,
  buildOptimizationExplanationPrompt,
  RECOVERY_ADVISORY_SYSTEM,
  buildRecoveryAdvisoryPrompt
} = require("./prompts");
const { calculatePriority } = require("../optimization/priorityService");

/**
 * AI Service wrapping xAI Grok API calls with robust deterministic fallbacks.
 */

/**
 * Analyzes the risk level of a task or defect.
 * 
 * @param {Object} task - Task details.
 * @returns {Promise<Object>} Risk analysis results.
 */
async function analyzeTaskRisk(task) {
  try {
    const prompt = buildRiskAnalysisPrompt(task);
    const result = await sendChatCompletion([
      { role: "system", content: RISK_ANALYSIS_SYSTEM },
      { role: "user", content: prompt }
    ], { jsonMode: true });

    return JSON.parse(result);
  } catch (error) {
    console.warn("Grok AI risk analysis unavailable, using deterministic fallback:", error.message);
    
    // Deterministic fallback based on task metrics
    const prio = calculatePriority(task);
    const riskLevel = prio.priorityLevel;
    
    return {
      riskLevel,
      reason: `Deterministic fallback: Task safety criticality is ${prio.factors.safetyCriticality} and overdue days is ${task.overdueDays || task.overdue_days || 0}.`,
      confidence: 0.85,
      factors: [
        `Safety Criticality: ${prio.factors.safetyCriticality}`,
        `Overdue days: ${task.overdueDays || task.overdue_days || 0}`,
        `Failure Risk score: ${prio.factors.failureRisk}`
      ]
    };
  }
}

/**
 * Explains the advantages of the optimized plan over the baseline.
 * 
 * @param {Object} baselineResult - Baseline schedule object.
 * @param {Object} optimizedResult - Optimized schedule object.
 * @param {Object} metrics - Comparison metrics.
 * @returns {Promise<Object>} Optimization explanation analysis.
 */
async function explainOptimization(baselineResult, optimizedResult, metrics) {
  try {
    const prompt = buildOptimizationExplanationPrompt(baselineResult, optimizedResult, metrics);
    const result = await sendChatCompletion([
      { role: "system", content: OPTIMIZATION_EXPLANATION_SYSTEM },
      { role: "user", content: prompt }
    ], { jsonMode: true });

    return JSON.parse(result);
  } catch (error) {
    console.warn("Grok AI optimization explanation unavailable, using deterministic fallback:", error.message);
    
    // Deterministic fallback explanation
    const reasons = [
      `Completes ${metrics.tasksCompleted} maintenance tasks.`,
      `Saves ${metrics.blockMinutesSaved} block minutes compared with independent scheduling.`
    ];
    if (metrics.coordinationCount > 0) {
      reasons.push(`Combines Engineering, SNT, and Traction work into ${metrics.coordinationCount} coordinated blocks.`);
    }
    if (metrics.affectedTrainPaths > 0) {
      reasons.push(`Manages scheduling to avoid highest traffic, affecting only ${metrics.affectedTrainPaths} train paths.`);
    }

    return {
      summary: `Coordinated optimization successfully schedules ${metrics.tasksCompleted} tasks and saves ${metrics.blockMinutesSaved} block minutes.`,
      reasons,
      riskLevel: metrics.affectedTrainPaths > 2 ? "MEDIUM" : "LOW"
    };
  }
}

/**
 * Analyzes an incident and explains the recovery strategy.
 * 
 * @param {Object} incident - Incident details.
 * @param {Array} affectedTrains - Affected trains list.
 * @param {Array} advisories - Operational actions.
 * @returns {Promise<Object>} Recovery advisory explanation.
 */
async function analyzeIncident(incident, affectedTrains, advisories) {
  try {
    const prompt = buildRecoveryAdvisoryPrompt(incident, affectedTrains, advisories);
    const result = await sendChatCompletion([
      { role: "system", content: RECOVERY_ADVISORY_SYSTEM },
      { role: "user", content: prompt }
    ], { jsonMode: true });

    return JSON.parse(result);
  } catch (error) {
    console.warn("Grok AI recovery advisory explanation unavailable, using deterministic fallback:", error.message);
    
    // Deterministic fallback explanation
    const actionCounts = {};
    advisories.forEach(ad => {
      actionCounts[ad.action] = (actionCounts[ad.action] || 0) + 1;
    });
    
    const actionsString = Object.entries(actionCounts)
      .map(([act, count]) => `${count} ${act}`)
      .join(", ");

    return {
      riskLevel: incident.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      recommendation: `Apply emergency restrictions: ${actionsString || 'NO_ACTION'}`,
      reason: `Deterministic fallback: Emergency advisory generated for section ${incident.track_section_id || incident.sectionId} due to a ${incident.severity} ${incident.incident_type || incident.type}. Trains on the section are held or rerouted to maintain corridor safety.`,
      confidence: 0.90,
      factors: [
        `Incident Section: ${incident.track_section_id || incident.sectionId}`,
        `Defect Severity: ${incident.severity}`,
        `Affected Trains: ${affectedTrains.length}`
      ]
    };
  }
}

/**
 * Explains recovery advisories for incidents.
 * 
 * @param {Object} incident - Incident data.
 * @param {Array} advisories - Generated advisory actions.
 * @returns {Promise<string>} Text recovery explanation.
 */
async function explainRecovery(incident, advisories) {
  try {
    const analysis = await analyzeIncident(incident, [], advisories);
    return analysis.reason;
  } catch (error) {
    return `Emergency actions applied. Section blocked. Advisories generated to protect traffic.`;
  }
}

/**
 * Generates natural-language operations summary.
 * 
 * @param {Object} metrics - Optimization metrics.
 * @returns {Promise<string>} Natural language summary.
 */
async function generateOperationsSummary(metrics) {
  try {
    const prompt = `Generate a concise 1-2 sentence operational summary for a schedule that has the following KPIs:
    - Block minutes saved: ${metrics.blockMinutesSaved}
    - Tasks completed: ${metrics.tasksCompleted}
    - Coordinated blocks: ${metrics.coordinationCount}
    - Affected trains: ${metrics.affectedTrainPaths}`;

    const content = await sendChatCompletion([
      { role: "system", content: "You are a brief railway dispatcher. Summarize optimization output in 1 sentence." },
      { role: "user", content: prompt }
    ], { temperature: 0.4 });

    return content.trim();
  } catch (error) {
    return `${metrics.tasksCompleted} maintenance tasks can be completed in coordinated blocks, saving ${metrics.blockMinutesSaved} block minutes.`;
  }
}

module.exports = {
  analyzeTaskRisk,
  explainOptimization,
  analyzeIncident,
  explainRecovery,
  generateOperationsSummary
};

