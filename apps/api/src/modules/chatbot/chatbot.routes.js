const express = require("express");
const { analyzeTaskRisk, explainOptimization, analyzeIncident } = require('./chatbot.service');

const router = express.Router();

// POST /api/ai/analyze
router.post("/analyze", async (req, res, next) => {
  try {
    const { type, context } = req.body;

    if (!type || !context) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_PARAMS",
          message: "Both type and context are required fields."
        }
      });
    }

    let analysisResult = null;

    switch (type.toUpperCase()) {
      case "OPTIMIZATION_EXPLANATION":
        // Mock a basic optimized blocks structure for completion if not provided
        const baselineResult = {};
        const optimizedResult = { recommendedBlocks: [] };
        
        // Calculate coordinationCount and blockMinutesSaved if missing but baseline/optimized are provided
        const metrics = {
          baselineBlockMinutes: context.baselineBlockMinutes || 0,
          optimizedBlockMinutes: context.optimizedBlockMinutes || 0,
          blockMinutesSaved: context.blockMinutesSaved || Math.max(0, (context.baselineBlockMinutes || 0) - (context.optimizedBlockMinutes || 0)),
          tasksCompleted: context.tasksCompleted || 0,
          criticalTasksCompleted: context.criticalTasksCompleted || 0,
          overdueTasksCleared: context.overdueTasksCleared || 0,
          affectedTrainPaths: context.affectedTrainPaths || 0,
          estimatedDelayMinutes: context.estimatedDelayMinutes || 0,
          assetAvailability: context.assetAvailability || 100,
          coordinationCount: context.coordinationCount || (context.blockMinutesSaved > 0 ? 1 : 0)
        };
        
        analysisResult = await explainOptimization(baselineResult, optimizedResult, metrics);
        break;

      case "TASK_RISK":
        analysisResult = await analyzeTaskRisk(context);
        break;

      case "INCIDENT_RECOVERY":
        const incident = context.incident || {};
        const affectedTrains = context.affectedTrains || [];
        const advisories = context.advisories || [];
        
        analysisResult = await analyzeIncident(incident, affectedTrains, advisories);
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_ANALYSIS_TYPE",
            message: `Analysis type ${type} is not supported. Must be: OPTIMIZATION_EXPLANATION, TASK_RISK, or INCIDENT_RECOVERY.`
          }
        });
    }

    res.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

