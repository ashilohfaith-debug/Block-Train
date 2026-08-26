/**
 * RailTwin Integration & Acceptance Test Harness.
 * Validates the complete backend API flow including:
 * Task submission -> priority -> baseline -> optimization -> metrics -> approval -> emergency -> advisories -> AI/Grok.
 */

const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("==================================================");
  console.log("Starting RailTwin Integration & Acceptance Tests...");
  console.log("==================================================");

  let planId = null;
  let incidentId = null;
  let task1Id = null;
  let task2Id = null;
  let task3Id = null;

  try {
    // 1. Health check
    console.log("\n[TEST 1] GET /health");
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, "Health status should be 200");
    assert(healthData.status === "healthy", "Health service status should be healthy");
    console.log("PASS:", healthData);

    // 2. Database health check
    console.log("\n[TEST 2] GET /db-health");
    const dbRes = await fetch(`${BASE_URL}/db-health`);
    const dbData = await dbRes.json();
    assert(dbRes.status === 200, "DB health status should be 200");
    assert(dbData.status === "connected", "DB connection should be successful");
    console.log("PASS:", dbData);

    // 3. Get tracks
    console.log("\n[TEST 3] GET /api/tracks");
    const tracksRes = await fetch(`${BASE_URL}/api/tracks`);
    const tracksData = await tracksRes.json();
    assert(tracksRes.status === 200, "Tracks response status should be 200");
    assert(tracksData.count > 0, "Tracks count should be greater than 0");
    console.log("PASS: Found", tracksData.count, "track sections.");

    // 4. Get network
    console.log("\n[TEST 4] GET /api/network");
    const netRes = await fetch(`${BASE_URL}/api/network`);
    const netData = await netRes.json();
    assert(netRes.status === 200, "Network status should be 200");
    assert(netData.corridor !== undefined, "Corridor name should be provided");
    console.log("PASS:", netData.corridor, "Summary:", netData.summary);

    // 5. Create Engineering task
    console.log("\n[TEST 5] POST /api/tasks (Engineering)");
    const task1Body = {
      department: "ENGINEERING",
      sectionId: "TBM-GDY",
      taskType: "TRACK_MAINTENANCE",
      description: "Rail inspection and repair",
      severity: "CRITICAL",
      safetyCriticality: 95,
      assetImpact: 90,
      failureRisk: 85,
      durationMinutes: 90,
      overdueDays: 5,
      deadline: "2026-08-23T18:00:00"
    };
    const t1Res = await postJson("/api/tasks", task1Body);
    assert(t1Res.status === 201, "Should return 201 Created");
    const t1Data = await t1Res.json();
    assert(t1Data.task.id !== undefined, "Task ID should be generated");
    task1Id = t1Data.task.id;
    console.log("PASS: Created engineering task ID:", task1Id);

    // 6. Create S&T task
    console.log("\n[TEST 6] POST /api/tasks (SNT)");
    const task2Body = {
      department: "SNT",
      sectionId: "TBM-GDY",
      taskType: "SIGNAL_MAINTENANCE",
      description: "Signal equipment inspection",
      severity: "HIGH",
      safetyCriticality: 80,
      assetImpact: 75,
      failureRisk: 70,
      durationMinutes: 45,
      overdueDays: 2,
      deadline: "2026-08-23T20:00:00"
    };
    const t2Res = await postJson("/api/tasks", task2Body);
    assert(t2Res.status === 201, "Should return 201 Created");
    const t2Data = await t2Res.json();
    task2Id = t2Data.task.id;
    console.log("PASS: Created SNT task ID:", task2Id);

    // 7. Create Traction task
    console.log("\n[TEST 7] POST /api/tasks (Traction)");
    const task3Body = {
      department: "TRACTION",
      sectionId: "TBM-GDY",
      taskType: "TRACTION_MAINTENANCE",
      description: "Overhead equipment inspection",
      severity: "HIGH",
      safetyCriticality: 78,
      assetImpact: 80,
      failureRisk: 65,
      durationMinutes: 60,
      overdueDays: 1,
      deadline: "2026-08-23T21:00:00"
    };
    const t3Res = await postJson("/api/tasks", task3Body);
    assert(t3Res.status === 201, "Should return 201 Created");
    const t3Data = await t3Res.json();
    task3Id = t3Data.task.id;
    console.log("PASS: Created Traction task ID:", task3Id);

    // 8. Get Priority score calculation check
    console.log("\n[TEST 8] POST /api/optimization/priority");
    const prioRes = await postJson("/api/optimization/priority", task1Body);
    const prioData = await prioRes.json();
    assert(prioRes.status === 200, "Priority calculations should succeed");
    assert(prioData.priorityScore !== undefined, "priorityScore should be returned");
    assert(prioData.priorityLevel === "CRITICAL", "Priority level should be CRITICAL");
    console.log("PASS:", prioData);

    // 9. Generate Baseline schedule
    console.log("\n[TEST 9] POST /api/optimization/baseline");
    const baseRes = await postJson("/api/optimization/baseline", {});
    const baseData = await baseRes.json();
    if (baseRes.status !== 200) {
      console.error("Test 9 failed. Status:", baseRes.status, "Body:", baseData);
    }
    assert(baseRes.status === 200, "Baseline should run successfully");
    assert(baseData.metrics.baselineBlockMinutes >= 195, "Baseline minutes should be at least 195");
    console.log("PASS: Baseline Block Minutes:", baseData.metrics.baselineBlockMinutes);

    // 10. Generate Coordinated Optimized plan
    console.log("\n[TEST 10] POST /api/optimization/optimize");
    const optRes = await postJson("/api/optimization/optimize", {});
    const optData = await optRes.json();
    if (optRes.status !== 200) {
      console.error("Test 10 failed. Status:", optRes.status, "Body:", optData);
    }
    assert(optRes.status === 200, "Optimizer should run successfully");
    assert(optData.planId !== null, "Plan ID should be returned");
    planId = optData.planId;
    
    // Find the block corresponding to TBM-GDY to assert its coordinated duration is 90
    const tbmGdyBlock = optData.recommendedBlocks.find(b => b.trackSectionId === "TBM-GDY");
    assert(tbmGdyBlock !== undefined, "A block should be scheduled on TBM-GDY");
    assert(tbmGdyBlock.durationMinutes === 90, `TBM-GDY block duration should be coordinated to 90 minutes, got ${tbmGdyBlock.durationMinutes}`);
    assert(tbmGdyBlock.coordinationType === "COORDINATED", "TBM-GDY block should be coordinated");
    
    console.log("PASS: Coordinated Plan Saved. Plan ID:", planId, "Total saved minutes:", optData.metrics.blockMinutesSaved);

    // 11. Compare plans
    console.log("\n[TEST 11] GET /api/plans/comparison");
    const compRes = await fetch(`${BASE_URL}/api/plans/comparison`);
    const compData = await compRes.json();
    assert(compRes.status === 200, "Plan comparison should succeed");
    assert(compData.planId === planId, "Should compare the latest generated plan");
    assert(compData.blockMinutesSaved >= 105, `Saved minutes comparison should be at least 105, got ${compData.blockMinutesSaved}`);
    console.log("PASS:", compData);

    // 12. GET /api/plans/weekly
    console.log("\n[TEST 12] GET /api/plans/weekly");
    const weekRes = await fetch(`${BASE_URL}/api/plans/weekly`);
    const weekData = await weekRes.json();
    assert(weekRes.status === 200, "Weekly plans retrieval should succeed");
    console.log("PASS: Found", weekData.count, "scheduled blocks.");

    // 13. GET /api/plans/monthly
    console.log("\n[TEST 13] GET /api/plans/monthly");
    const monthRes = await fetch(`${BASE_URL}/api/plans/monthly`);
    const monthData = await monthRes.json();
    assert(monthRes.status === 200, "Monthly plans retrieval should succeed");
    console.log("PASS: Found", monthData.count, "scheduled blocks.");

    // 14. Approve plan
    console.log("\n[TEST 14] POST /api/plans/:id/approve");
    const appRes = await postJson(`/api/plans/${planId}/approve`, {});
    const appData = await appRes.json();
    assert(appRes.status === 200, "Plan approval should succeed");
    assert(appData.plan.status === "APPROVED", "Plan status should be APPROVED");
    console.log("PASS: Plan status updated to:", appData.plan.status);

    // 15. Create Emergency Incident
    console.log("\n[TEST 15] POST /api/incidents (Emergency track defect)");
    const incidentBody = {
      sectionId: "TBM-GDY",
      type: "TRACK_DEFECT",
      severity: "CRITICAL",
      description: "Critical track defect detected"
    };
    const incRes = await postJson("/api/incidents", incidentBody);
    const incData = await incRes.json();
    assert(incRes.status === 201, "Incident report should return 201");
    assert(incData.trackStatus === "BLOCKED", "Track section status should be BLOCKED");
    assert(incData.affectedTrainsCount > 0, "Trains should be affected on TBM-GDY");
    assert(incData.advisories.length > 0, "Operational advisories should be generated");
    incidentId = incData.incident.id;
    console.log("PASS: Incident Reported. Incident ID:", incidentId, "Track Status:", incData.trackStatus, "Train Advisories generated.");

    // 16. Get Incident Impact
    console.log("\n[TEST 16] GET /api/incidents/:id/impact");
    const impRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}/impact`);
    const impData = await impRes.json();
    assert(impRes.status === 200, "Incident impact should be retrieved");
    assert(impData.incidentId === incidentId, "Incident ID should match");
    assert(impData.affectedTrains.length > 0, "Should list affected trains");
    console.log("PASS: Affected Trains:", impData.affectedTrains, "Estimated delays:", impData.estimatedDelays, "minutes.");

    // 17. Get Incident Advisory
    console.log("\n[TEST 17] GET /api/incidents/:id/advisory");
    const advRes = await fetch(`${BASE_URL}/api/incidents/${incidentId}/advisory`);
    const advData = await advRes.json();
    assert(advRes.status === 200, "Advisory should be retrieved");
    assert(advData.advisories.length > 0, "Should return simulated advisories");
    assert(advData.simulationOnly === true, "Should return simulationOnly: true");
    assert(advData.requiresControllerApproval === true, "Should return requiresControllerApproval: true");
    console.log("PASS: Train Advisories list:", advData.advisories);

    // 18. Test AI/Grok Endpoint
    console.log("\n[TEST 18] POST /api/ai/analyze");
    const aiBody = {
      type: "OPTIMIZATION_EXPLANATION",
      context: {
        baselineBlockMinutes: 195,
        optimizedBlockMinutes: 90,
        tasksCompleted: 3,
        affectedTrainPaths: 2
      }
    };
    const aiRes = await postJson("/api/ai/analyze", aiBody);
    const aiData = await aiRes.json();
    assert(aiRes.status === 200, "AI analysis should succeed");
    assert(aiData.analysis.summary !== undefined, "Should return a summary in response");
    console.log("PASS: AI Response analysis:", aiData.analysis);

    // ====================================================
    // 19. REQUIRED ERROR TESTS
    // ====================================================
    console.log("\n==================================================");
    console.log("Running Mandatory Error validation checks...");
    console.log("==================================================");

    // Invalid department
    console.log("\n[ERROR TEST 1] Invalid department on task creation");
    const errRes1 = await postJson("/api/tasks", { ...task1Body, department: "HUMAN_RESOURCES" });
    const errData1 = await errRes1.json();
    assert(errRes1.status === 400, " HR department is invalid, should fail with 400");
    assert(errData1.error.code === "INVALID_DEPARTMENT", "Error code should be INVALID_DEPARTMENT");
    console.log("PASS (Caught expected error):", errData1.error);

    // Invalid severity
    console.log("\n[ERROR TEST 2] Invalid severity on task creation");
    const errRes2 = await postJson("/api/tasks", { ...task1Body, severity: "SUPER_CRITICAL" });
    const errData2 = await errRes2.json();
    assert(errRes2.status === 400, "SUPER_CRITICAL severity should fail with 400");
    assert(errData2.error.code === "INVALID_SEVERITY", "Error code should be INVALID_SEVERITY");
    console.log("PASS (Caught expected error):", errData2.error);

    // Nonexistent section ID
    console.log("\n[ERROR TEST 3] Nonexistent section ID");
    const errRes3 = await postJson("/api/tasks", { ...task1Body, sectionId: "DEL-MUM-EXPRESS" });
    const errData3 = await errRes3.json();
    assert(errRes3.status === 400, "Section DEL-MUM-EXPRESS doesn't exist, should fail with 400");
    assert(errData3.error.code === "SECTION_NOT_FOUND", "Error code should be SECTION_NOT_FOUND");
    console.log("PASS (Caught expected error):", errData3.error);

    // Negative duration
    console.log("\n[ERROR TEST 4] Negative duration");
    const errRes4 = await postJson("/api/tasks", { ...task1Body, durationMinutes: -30 });
    const errData4 = await errRes4.json();
    assert(errRes4.status === 400, "Negative duration should fail with 400");
    assert(errData4.error.code === "INVALID_DURATION", "Error code should be INVALID_DURATION");
    console.log("PASS (Caught expected error):", errData4.error);

    // Nonexistent task ID
    console.log("\n[ERROR TEST 5] Nonexistent task ID GET");
    const errRes5 = await fetch(`${BASE_URL}/api/tasks/99999`);
    const errData5 = await errRes5.json();
    assert(errRes5.status === 404, "Task 99999 doesn't exist, should fail with 404");
    assert(errData5.error.code === "TASK_NOT_FOUND", "Error code should be TASK_NOT_FOUND");
    console.log("PASS (Caught expected error):", errData5.error);

    // Nonexistent incident ID
    console.log("\n[ERROR TEST 6] Nonexistent incident ID GET impact");
    const errRes6 = await fetch(`${BASE_URL}/api/incidents/99999/impact`);
    const errData6 = await errRes6.json();
    assert(errRes6.status === 404, "Incident 99999 doesn't exist, should fail with 404");
    assert(errData6.error.code === "INCIDENT_NOT_FOUND", "Error code should be INCIDENT_NOT_FOUND");
    console.log("PASS (Caught expected error):", errData6.error);

    // Approving nonexistent plan
    console.log("\n[ERROR TEST 7] Approving nonexistent plan");
    const errRes7 = await postJson("/api/plans/99999/approve", {});
    const errData7 = await errRes7.json();
    assert(errRes7.status === 404, "Plan 99999 doesn't exist, should fail with 404");
    assert(errData7.error.code === "PLAN_NOT_FOUND", "Error code should be PLAN_NOT_FOUND");
    console.log("PASS (Caught expected error):", errData7.error);

    // Approving already rejected plan
    console.log("\n[ERROR TEST 8] Approving already rejected plan");
    // Create new tasks and plan first to obtain a DRAFT/RECOMMENDED plan
    const testTaskBody = {
      department: "ENGINEERING",
      sectionId: "TBM-CMP",
      taskType: "TRACK_MAINTENANCE",
      description: "Rail alignment correction",
      severity: "MEDIUM",
      safetyCriticality: 60,
      assetImpact: 50,
      failureRisk: 50,
      durationMinutes: 30,
      overdueDays: 0,
      deadline: "2026-08-25T18:00:00"
    };
    await postJson("/api/tasks", testTaskBody);
    const tOptRes = await postJson("/api/optimization/optimize", {});
    const tOptData = await tOptRes.json();
    const subPlanId = tOptData.planId;
    
    // Reject it first
    await postJson(`/api/plans/${subPlanId}/reject`, {});
    
    // Attempt to approve
    const errRes8 = await postJson(`/api/plans/${subPlanId}/approve`, {});
    const errData8 = await errRes8.json();
    assert(errRes8.status === 400, "Approving rejected plan should fail with 400");
    assert(errData8.error.code === "INVALID_PLAN_STATE", "Error code should be INVALID_PLAN_STATE");
    console.log("PASS (Caught expected error):", errData8.error);

    // Rejecting already approved plan
    console.log("\n[ERROR TEST 9] Rejecting already approved plan");
    // Create another task and plan
    await postJson("/api/tasks", { ...testTaskBody, description: "Second rail alignment correction" });
    const tOptRes2 = await postJson("/api/optimization/optimize", {});
    const tOptData2 = await tOptRes2.json();
    const subPlanId2 = tOptData2.planId;
    
    // Approve it first
    await postJson(`/api/plans/${subPlanId2}/approve`, {});
    
    // Attempt to reject
    const errRes9 = await postJson(`/api/plans/${subPlanId2}/reject`, {});
    const errData9 = await errRes9.json();
    assert(errRes9.status === 400, "Rejecting approved plan should fail with 400");
    assert(errData9.error.code === "INVALID_PLAN_STATE", "Error code should be INVALID_PLAN_STATE");
    console.log("PASS (Caught expected error):", errData9.error);

    console.log("\n==================================================");
    console.log("All integration and error tests PASSED successfully!");
    console.log("==================================================");
    process.exit(0);

  } catch (error) {
    console.error("\nTEST FAILED:", error.message);
    process.exit(1);
  }
}

// Helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function postJson(path, body) {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

runTests();
