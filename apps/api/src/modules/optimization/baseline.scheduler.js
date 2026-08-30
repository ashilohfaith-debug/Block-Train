const { calculatePriority } = require('./priority.service');

/**
 * Generates an uncoordinated baseline schedule where every task is assigned its own independent block.
 * 
 * @param {Array} tasks - Array of maintenance tasks.
 * @returns {Object} Baseline schedule results including blocks, duration, and task details.
 */
function generateBaseline(tasks) {
  let totalBlockMinutes = 0;
  const recommendedBlocks = [];
  const tasksScheduled = [];

  // Sort tasks by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    const scoreA = calculatePriority(a).priorityScore;
    const scoreB = calculatePriority(b).priorityScore;
    return scoreB - scoreA;
  });

  // Assign each task to an independent block
  for (let i = 0; i < sortedTasks.length; i++) {
    const task = sortedTasks[i];
    const duration = Number(task.required_duration_minutes || task.requiredDurationMinutes || task.durationMinutes || 0);
    totalBlockMinutes += duration;

    let startTime = task.requested_start || task.requestedStart || task.due_date || task.dueDate || task.deadline || new Date();
    if (typeof startTime === 'string') {
      startTime = new Date(startTime);
    } else if (!(startTime instanceof Date)) {
      startTime = new Date();
    }
    // Separate baseline blocks sequentially by 2-hour offsets to illustrate independent scheduling
    const shiftedStart = new Date(startTime.getTime() + i * 3600 * 1000 * 2);
    const shiftedEnd = new Date(shiftedStart.getTime() + duration * 60000);

    const block = {
      id: `BASE-BLOCK-${i + 1}`,
      trackSectionId: task.track_section_id || task.trackSectionId || task.sectionId || task.section,
      startTime: shiftedStart.toISOString(),
      endTime: shiftedEnd.toISOString(),
      durationMinutes: duration,
      departments: [task.department],
      tasks: [task.id || i + 1],
      coordinationType: "INDEPENDENT"
    };

    recommendedBlocks.push(block);

    const prio = calculatePriority(task);
    tasksScheduled.push({
      id: task.id || i + 1,
      department: task.department,
      taskType: task.task_type || task.taskType,
      trackSectionId: task.track_section_id || task.trackSectionId || task.sectionId || task.section,
      description: task.description,
      severity: task.severity,
      durationMinutes: duration,
      priorityScore: prio.priorityScore,
      priorityLevel: prio.priorityLevel,
      overdueDays: task.overdue_days || task.overdueDays || 0,
      scheduledStart: shiftedStart.toISOString(),
      scheduledEnd: shiftedEnd.toISOString()
    });
  }

  return {
    recommendedBlocks,
    tasksScheduled,
    tasksUnscheduled: [],
    affectedTrains: [],
    objectiveValue: totalBlockMinutes,
    metrics: {
      baselineBlockMinutes: totalBlockMinutes,
      tasksCompleted: tasksScheduled.length,
      criticalTasksCompleted: tasksScheduled.filter(t => t.priorityLevel === 'CRITICAL' || t.priorityLevel === 'HIGH').length
    }
  };
}

module.exports = {
  generateBaseline
};

