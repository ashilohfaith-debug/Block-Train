/**
 * Calculates a deterministic and explainable priority score.
 * 
 * Formula:
 * priorityScore = 0.35 * safetyCriticality + 0.30 * overdueUrgency + 0.20 * assetImpact + 0.15 * failureRisk
 * 
 * Normalizes parameters to 0-100.
 * 
 * @param {Object} task - Task data containing metrics.
 * @returns {Object} Priority object containing score, level, factors, and text explanation.
 */
function calculatePriority(task) {
  // Normalize safety criticality: default to 50 if not provided
  let safetyCriticality = 50;
  if (task.safetyCriticality !== undefined) {
    safetyCriticality = Number(task.safetyCriticality);
  } else if (task.safety_criticality !== undefined) {
    safetyCriticality = Number(task.safety_criticality);
  } else if (task.severity) {
    // Severity-based fallback if numeric score is absent
    const mapping = { CRITICAL: 95, HIGH: 80, MEDIUM: 50, LOW: 20 };
    safetyCriticality = mapping[task.severity.toUpperCase()] || 50;
  }

  // Normalize overdue urgency based on overdueDays (5 days -> 90 urgency, i.e., 18 per day)
  let overdueDays = 0;
  if (task.overdueDays !== undefined) {
    overdueDays = Number(task.overdueDays);
  } else if (task.overdue_days !== undefined) {
    overdueDays = Number(task.overdue_days);
  }
  const overdueUrgency = Math.min(100, overdueDays * 18);

  // Normalize asset impact
  let assetImpact = 50;
  if (task.assetImpact !== undefined) {
    assetImpact = Number(task.assetImpact);
  } else if (task.asset_impact !== undefined) {
    assetImpact = Number(task.asset_impact);
  } else if (task.severity) {
    const mapping = { CRITICAL: 90, HIGH: 75, MEDIUM: 50, LOW: 20 };
    assetImpact = mapping[task.severity.toUpperCase()] || 50;
  }

  // Normalize failure risk
  let failureRisk = 50;
  if (task.failureRisk !== undefined) {
    failureRisk = Number(task.failureRisk);
  } else if (task.failure_risk !== undefined) {
    failureRisk = Number(task.failure_risk);
  } else if (task.severity) {
    const mapping = { CRITICAL: 85, HIGH: 70, MEDIUM: 50, LOW: 20 };
    failureRisk = mapping[task.severity.toUpperCase()] || 50;
  }

  // Deterministic calculation
  const score = 0.35 * safetyCriticality + 0.30 * overdueUrgency + 0.20 * assetImpact + 0.15 * failureRisk;
  const finalScore = Math.round(score);

  let level = "LOW";
  if (finalScore >= 85) level = "CRITICAL";
  else if (finalScore >= 70) level = "HIGH";
  else if (finalScore >= 50) level = "MEDIUM";

  let explanation = `High priority because the task is safety-critical, overdue, and affects a high-impact infrastructure section.`;
  if (finalScore < 50) {
    explanation = "Low priority because the task has minimal safety risk and is not overdue.";
  } else if (finalScore < 70) {
    explanation = "Medium priority routine maintenance with moderate asset impact and failure risk.";
  } else if (finalScore < 85) {
    explanation = "High priority due to elevated safety criticality and failure risk.";
  }

  return {
    priorityScore: finalScore,
    priorityLevel: level,
    factors: {
      safetyCriticality,
      overdueUrgency,
      assetImpact,
      failureRisk
    },
    explanation
  };
}

module.exports = {
  calculatePriority
};

