/**
 * Generates deterministic explanations for RailTwin schedules.
 */

/**
 * Generates a human-readable explanation from plan optimization metrics and block outputs.
 * 
 * @param {Object} metrics - Optimization metrics.
 * @param {Array} blocks - Scheduled blocks.
 * @returns {string} Factual explanation of why this plan was chosen.
 */
function generateExplanation(metrics, blocks) {
  const reasons = [];

  reasons.push(`it completes ${metrics.tasksCompleted} maintenance task${metrics.tasksCompleted === 1 ? '' : 's'}`);
  
  if (metrics.coordinationCount > 0) {
    reasons.push(`it combines Engineering, SNT, and Traction work into coordinated windows`);
  }
  
  if (metrics.affectedTrainPaths > 0) {
    reasons.push(`it schedules blocks during optimal time slots, affecting ${metrics.affectedTrainPaths} train paths with an estimated delay of ${metrics.estimatedDelayMinutes} minutes`);
  } else {
    reasons.push("it avoids train-traffic periods to prevent delays");
  }
  
  if (metrics.overdueTasksCleared > 0) {
    reasons.push(`it clears ${metrics.overdueTasksCleared} overdue maintenance task${metrics.overdueTasksCleared === 1 ? '' : 's'}`);
  }
  
  if (metrics.blockMinutesSaved > 0) {
    reasons.push(`it saves ${metrics.blockMinutesSaved} block minutes compared with independent scheduling`);
  }

  if (reasons.length === 0) {
    return "No pending maintenance tasks scheduled.";
  }

  const bulletPoints = reasons.map(r => ` - ${r};`).join("\n");
  
  // Format the explanation exactly as requested in the prompt
  return `Recommended plan because:\n${bulletPoints.slice(0, -1)}.`;
}

module.exports = {
  generateExplanation
};

