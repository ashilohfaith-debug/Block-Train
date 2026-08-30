const pool = require('../../core/db');
const { calculatePriority } = require('./priority.service');
const { calculateMetrics } = require('./metrics.service');
const { generateExplanation } = require('./explanation.service');
const { logAction } = require('../../core/services/auditService');

/**
 * Pure optimization logic. Takes inputs and computes the optimal coordinated schedule.
 * 
 * @param {Array} tasks - List of pending maintenance tasks.
 * @param {Array} windows - List of available block windows.
 * @param {Array} trains - List of trains scheduled.
 * @returns {Object} Coordinated schedule results.
 */
function optimizeSchedule(tasks, windows, trains) {
  // Sort tasks by priority score descending
  const tasksWithPriority = tasks.map(t => ({
    ...t,
    _prio: calculatePriority(t)
  }));
  
  // Group tasks by section
  const tasksBySection = {};
  tasksWithPriority.forEach(t => {
    const secId = t.track_section_id || t.trackSectionId || t.sectionId || t.section;
    if (!secId) return;
    if (!tasksBySection[secId]) tasksBySection[secId] = [];
    tasksBySection[secId].push(t);
  });

  // Group windows by section
  const windowsBySection = {};
  windows.forEach(w => {
    const secId = w.track_section_id || w.trackSectionId;
    if (!secId) return;
    if (!windowsBySection[secId]) windowsBySection[secId] = [];
    windowsBySection[secId].push(w);
  });

  const recommendedBlocks = [];
  const tasksScheduled = [];
  const tasksUnscheduled = [];
  const allAffectedTrains = [];

  // For each section with tasks:
  for (const sectionId in tasksBySection) {
    const secTasks = tasksBySection[sectionId];
    const secWindows = windowsBySection[sectionId] || [];

    if (secWindows.length === 0) {
      secTasks.forEach(t => tasksUnscheduled.push(t));
      continue;
    }

    let bestWindow = null;
    let bestWindowTasks = [];
    let bestWindowScore = -Infinity;
    let bestWindowAffectedTrains = [];
    let bestWindowDuration = 0;

    for (const win of secWindows) {
      const winStart = new Date(win.start_time || win.startTime);
      const winEnd = new Date(win.end_time || win.endTime);
      const winDuration = (winEnd - winStart) / 60000;

      // Filter tasks that can fit in this window
      const candidateTasks = secTasks.filter(t => {
        const duration = Number(t.required_duration_minutes || t.requiredDurationMinutes || t.durationMinutes || 0);
        if (duration > winDuration) return false;
        
        // Check deadline
        if (t.deadline || t.due_date || t.dueDate) {
          const deadline = new Date(t.deadline || t.due_date || t.dueDate);
          if (winEnd > deadline) return false;
        }
        return true;
      });

      if (candidateTasks.length === 0) continue;

      const maxTaskDuration = Math.max(...candidateTasks.map(t => Number(t.required_duration_minutes || t.requiredDurationMinutes || t.durationMinutes || 0)));
      
      const blockStart = winStart;
      const blockEnd = new Date(winStart.getTime() + maxTaskDuration * 60000);

      // Find trains affected on this section during [blockStart, blockEnd]
      const affectedTrains = trains.filter(tr => {
        const trSec = tr.current_track_section_id || tr.currentTrackSectionId;
        if (trSec !== sectionId) return false;
        const trTime = new Date(tr.scheduled_time || tr.scheduledTime);
        return trTime >= blockStart && trTime <= blockEnd;
      });

      // Calculate score = sum(priorities) - sum(train penalties)
      const taskScoreSum = candidateTasks.reduce((sum, t) => sum + t._prio.priorityScore, 0);

      const trainPenalty = affectedTrains.reduce((sum, tr) => {
        const type = (tr.train_type || tr.trainType || '').toUpperCase();
        if (type.includes('EXPRESS')) return sum + 30;
        if (type.includes('PASSENGER')) return sum + 20;
        return sum + 10;
      }, 0);

      const objectiveScore = taskScoreSum - trainPenalty;

      if (objectiveScore > bestWindowScore) {
        bestWindowScore = objectiveScore;
        bestWindow = win;
        bestWindowTasks = candidateTasks;
        bestWindowAffectedTrains = affectedTrains;
        bestWindowDuration = maxTaskDuration;
      }
    }

    if (bestWindow) {
      const winStart = new Date(bestWindow.start_time || bestWindow.startTime);
      const blockEnd = new Date(winStart.getTime() + bestWindowDuration * 60000);
      const blockId = `BLOCK-${sectionId}-${winStart.getTime()}`;

      const block = {
        id: blockId,
        trackSectionId: sectionId,
        startTime: winStart.toISOString(),
        endTime: blockEnd.toISOString(),
        durationMinutes: bestWindowDuration,
        departments: [...new Set(bestWindowTasks.map(t => t.department))],
        tasks: bestWindowTasks.map(t => t.id),
        coordinationType: bestWindowTasks.length > 1 ? "COORDINATED" : "SINGLE",
        affectedTrains: bestWindowAffectedTrains.map(tr => ({
          trainId: tr.id,
          trainNumber: tr.train_name,
          trainType: tr.train_type,
          impact: tr.train_type === 'EXPRESS' ? 'HIGH' : tr.train_type === 'PASSENGER' ? 'MEDIUM' : 'LOW'
        }))
      };

      recommendedBlocks.push(block);
      
      bestWindowTasks.forEach(t => {
        tasksScheduled.push({
          id: t.id,
          department: t.department,
          taskType: t.task_type || t.taskType,
          trackSectionId: sectionId,
          description: t.description,
          severity: t.severity,
          durationMinutes: Number(t.required_duration_minutes || t.requiredDurationMinutes || t.durationMinutes || 0),
          priorityScore: t._prio.priorityScore,
          priorityLevel: t._prio.priorityLevel,
          overdueDays: t.overdue_days || t.overdueDays || 0,
          scheduledStart: winStart.toISOString(),
          scheduledEnd: blockEnd.toISOString()
        });
      });

      // Determine unscheduled tasks for this section
      const scheduledIds = new Set(bestWindowTasks.map(t => t.id));
      secTasks.forEach(t => {
        if (!scheduledIds.has(t.id)) {
          tasksUnscheduled.push(t);
        }
      });

      bestWindowAffectedTrains.forEach(tr => {
        allAffectedTrains.push({
          trainId: tr.id,
          trainNumber: tr.train_name,
          trainType: tr.train_type,
          impact: tr.train_type === 'EXPRESS' ? 'HIGH' : tr.train_type === 'PASSENGER' ? 'MEDIUM' : 'LOW'
        });
      });

    } else {
      secTasks.forEach(t => tasksUnscheduled.push(t));
    }
  }

  // Calculate KPIs using metricsService
  const metrics = calculateMetrics(tasksScheduled, recommendedBlocks, allAffectedTrains);
  
  // Calculate explanation using explanationService
  const explanation = generateExplanation(metrics, recommendedBlocks);

  return {
    recommendedBlocks,
    tasksScheduled,
    tasksUnscheduled: tasksUnscheduled.map(t => ({
      id: t.id,
      department: t.department,
      trackSectionId: t.track_section_id || t.trackSectionId,
      description: t.description,
      priorityScore: t._prio.priorityScore
    })),
    affectedTrains: allAffectedTrains,
    objectiveValue: metrics.blockMinutesSaved,
    metrics,
    explanation
  };
}

/**
 * Runs the optimizer service using database data and saves the resulting plan.
 * 
 * @returns {Promise<Object>} The saved plan object and optimization results.
 */
async function optimizeAndSavePlan() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch pending tasks
    const tasksRes = await client.query(
      `SELECT * FROM maintenance_tasks WHERE status IN ('PENDING', 'PLANNED') ORDER BY due_date ASC`
    );
    const tasks = tasksRes.rows;

    // 2. Fetch available block windows
    const windowsRes = await client.query(
      `SELECT * FROM block_windows WHERE availability_status = 'AVAILABLE'`
    );
    const windows = windowsRes.rows;

    // 3. Fetch scheduled trains
    const trainsRes = await client.query(
      `SELECT * FROM trains WHERE status = 'SCHEDULED'`
    );
    const trains = trainsRes.rows;

    // 4. Run optimization
    const result = optimizeSchedule(tasks, windows, trains);

    // 5. If no tasks scheduled, return without saving empty plan or return structured object
    if (result.tasksScheduled.length === 0) {
      await client.query("COMMIT");
      return {
        id: null,
        status: "DRAFT",
        ...result
      };
    }

    // 6. Save plan in database
    const planRes = await client.query(
      `
        INSERT INTO plans 
          (status, baseline_block_minutes, optimized_block_minutes, block_minutes_saved, metrics, explanation)
        VALUES 
          ('RECOMMENDED', $1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        result.metrics.baselineBlockMinutes,
        result.metrics.optimizedBlockMinutes,
        result.metrics.blockMinutesSaved,
        JSON.stringify(result.metrics),
        result.explanation
      ]
    );
    const savedPlan = planRes.rows[0];

    // 7. Save each plan block and map tasks
    for (const block of result.recommendedBlocks) {
      const blockRes = await client.query(
        `
          INSERT INTO plan_blocks 
            (plan_id, track_section_id, start_time, end_time, duration_minutes)
          VALUES 
            ($1, $2, $3, $4, $5)
          RETURNING id
        `,
        [
          savedPlan.id,
          block.trackSectionId,
          block.startTime,
          block.endTime,
          block.durationMinutes
        ]
      );
      const savedBlockId = blockRes.rows[0].id;

      for (const taskId of block.tasks) {
        // Map block to task
        await client.query(
          `INSERT INTO plan_tasks (plan_block_id, task_id) VALUES ($1, $2)`,
          [savedBlockId, taskId]
        );

        // Update task status in database
        await client.query(
          `UPDATE maintenance_tasks SET status = 'PLANNED' WHERE id = $1`,
          [taskId]
        );
      }
    }

    // 8. Log audit entry
    await logAction(
      "SYSTEM",
      "PLAN_GENERATED",
      "plans",
      savedPlan.id,
      null,
      "RECOMMENDED",
      `Plan generated containing ${result.tasksScheduled.length} scheduled tasks.`
    );

    await client.query("COMMIT");
    
    return {
      id: savedPlan.id,
      status: savedPlan.status,
      ...result
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Optimization transaction failed:", error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  optimizeSchedule,
  optimizeAndSavePlan
};

