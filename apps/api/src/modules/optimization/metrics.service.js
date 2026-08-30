/**
 * Calculations for RailTwin scheduling optimization metrics.
 */

/**
 * Calculates metrics comparing the baseline (independent scheduling) and optimized plans.
 * 
 * @param {Array} tasksScheduled - Tasks scheduled in the optimization.
 * @param {Array} blocks - Recommended block windows generated.
 * @param {Array} affectedTrains - List of affected trains.
 * @param {number} totalSections - Total number of sections in the network (default 15).
 * @returns {Object} Calculated metrics.
 */
function calculateMetrics(tasksScheduled, blocks, affectedTrains, totalSections = 15) {
  // Baseline minutes: sum of individual task durations
  const baselineBlockMinutes = tasksScheduled.reduce((sum, t) => sum + Number(t.durationMinutes || t.required_duration_minutes || 0), 0);
  
  // Optimized minutes: sum of block durations
  const optimizedBlockMinutes = blocks.reduce((sum, b) => sum + Number(b.durationMinutes || 0), 0);
  
  const blockMinutesSaved = Math.max(0, baselineBlockMinutes - optimizedBlockMinutes);
  
  const tasksCompleted = tasksScheduled.length;
  const criticalTasksCompleted = tasksScheduled.filter(t => t.priorityLevel === 'CRITICAL' || t.priorityLevel === 'HIGH' || t.severity === 'CRITICAL' || t.severity === 'HIGH').length;
  const overdueTasksCleared = tasksScheduled.filter(t => Number(t.overdueDays || t.overdue_days || 0) > 0).length;
  
  // Unique trains affected
  const uniqueTrainIds = new Set(affectedTrains.map(t => t.trainId || t.id));
  const affectedTrainPaths = uniqueTrainIds.size;
  
  // Estimate delay: EXPRESS = 25, PASSENGER = 15, FREIGHT = 10 minutes
  let estimatedDelayMinutes = 0;
  affectedTrains.forEach(t => {
    const type = (t.trainType || t.train_type || 'PASSENGER').toUpperCase();
    if (type.includes('EXPRESS')) {
      estimatedDelayMinutes += 25;
    } else if (type.includes('PASSENGER')) {
      estimatedDelayMinutes += 15;
    } else {
      estimatedDelayMinutes += 10;
    }
  });

  // Asset availability calculation: percentage of operational sections
  const distinctSectionsBlocked = new Set(blocks.map(b => b.trackSectionId || b.track_section_id));
  const assetAvailability = Math.max(0, Math.min(100, ((totalSections - distinctSectionsBlocked.size) / totalSections) * 100));
  
  // Coordination count: blocks containing tasks from multiple departments
  let coordinationCount = 0;
  blocks.forEach(b => {
    if (b.departments && b.departments.length > 1) {
      coordinationCount += 1;
    }
  });

  return {
    baselineBlockMinutes,
    optimizedBlockMinutes,
    blockMinutesSaved,
    tasksCompleted,
    criticalTasksCompleted,
    overdueTasksCleared,
    affectedTrainPaths,
    estimatedDelayMinutes,
    assetAvailability: Math.round(assetAvailability * 100) / 100,
    coordinationCount
  };
}

module.exports = {
  calculateMetrics
};

