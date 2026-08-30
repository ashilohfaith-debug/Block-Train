/**
 * ============================================================
 * src/app.js  —  Express Application Configuration
 * ============================================================
 *
 * PURPOSE
 * -------
 * This file creates and configures the Express application object.
 * It is intentionally separated from server.js so that:
 *   • The app can be tested in isolation without binding to a port.
 *   • server.js stays as a thin "start the server" script only.
 *
 * SECURITY LAYERS APPLIED HERE
 * -----------------------------
 *  1. CORS  – only allows requests from trusted origins.
 *  2. JSON body parsing with a size limit to prevent oversized payloads.
 *  3. Auth middleware (JWT) protects every /api/* route EXCEPT /api/auth/*.
 *  4. RBAC middleware is applied per-router to restrict specific endpoints
 *     to specific roles (ADMIN, CONTROLLER, ENGINEERING, SNT, TRACTION).
 *  5. Central error handler formats all errors safely.
 *
 * ROUTE MAP
 * ---------
 *   POST /api/auth/register    ← public  (no token needed)
 *   POST /api/auth/login       ← public  (no token needed)
 *
 *   GET  /api/tracks           ← all authenticated roles
 *   GET  /api/network          ← all authenticated roles
 *
 *   /api/tasks                 ← all authenticated roles
 *                                (RBAC + department isolation applied inside router)
 *   /api/optimization          ← CONTROLLER + ADMIN only
 *   /api/plans                 ← CONTROLLER + ADMIN only
 *   /api/incidents             ← CONTROLLER + ADMIN + department roles
 *   /api/ai                    ← CONTROLLER + ADMIN only
 */

const express = require("express");
const cors    = require("cors");

// ── Middleware imports ────────────────────────────────────────────────────────
const { authenticateToken } = require("./middleware/auth");
const { requireRole }       = require("./middleware/rbac");
const { errorHandler }      = require("./middleware/errorHandler");
const { securityHeaders, createRateLimiter } = require("./middleware/security");

// ── Route imports ─────────────────────────────────────────────────────────────
const authRouter         = require("./routes/auth");
const tracksRouter       = require("./routes/tracks");
const networkRouter      = require("./routes/network");
const tasksRouter        = require("./routes/tasks");
const plansRouter        = require("./routes/plans");
const optimizationRouter = require("./routes/optimization");
const incidentsRouter    = require("./routes/incidents");
const aiRouter           = require("./routes/ai");
const activeBlocksRouter = require("./routes/active_blocks");
const dispatchRouter     = require("./routes/dispatch");
const workersRouter      = require("./routes/workers");

// ── Database pool (needed for /db-health) ────────────────────────────────────
const pool = require("./db");

const app = express();

// Add low-cost browser protections before parsing or routing any request.
app.use(securityHeaders);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Global Middleware
// Applied to every request before it reaches any route handler.
// ─────────────────────────────────────────────────────────────────────────────

// CORS — in production restrict origin to the actual frontend domain.
// During development "*" is acceptable but must be tightened before deployment.
// CORS is deny-by-default in production; configure trusted web origins in .env.
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed."));
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
}));

// JSON body parser.  The 10 kb limit protects against payload-based DoS attacks.
app.use(express.json({ limit: "10kb" }));

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Public Routes (no token required)
// These must be registered BEFORE the global authentication guard below.
// ─────────────────────────────────────────────────────────────────────────────

// System-level health probes — used by load balancers and monitoring tools.
app.get("/", (req, res) => {
  res.json({ message: "Railway Block Planning API", status: "running" });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", service: "railway-block-planning-api" });
});

// Database connectivity probe — checks whether the Neon Postgres pool can respond.
app.get("/db-health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");
    res.json({ status: "connected", databaseTime: result.rows[0].database_time });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    // Return 500 but do NOT expose the raw error message to the client.
    res.status(500).json({ status: "disconnected", error: "Database unreachable." });
  }
});

// Authentication endpoints — public so users can register and log in.
// Every other /api route requires a valid JWT produced by these endpoints.
// Login and registration are the most attractive brute-force targets.
app.use("/api/auth", createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many authentication attempts. Please try again later."
}), authRouter);

// Make network public for frontend connection testing
app.use("/api/network", networkRouter);

// Make active blocks public for testing
app.use("/api/active_blocks", activeBlocksRouter);

// Twilio dispatch route (public for chatbot to hit easily during hackathon)
app.use("/api/dispatch", dispatchRouter);

// Workers route
app.use("/api/workers", workersRouter);

// (The /uploads folder static serving was removed because we now use Cloudinary for audio storage)

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Global Authentication Guard
// authenticateToken() will return 401 if the token is missing or invalid.
// ─────────────────────────────────────────────────────────────────────────────
app.use("/api", authenticateToken);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Protected Routes with Role-Based Access Control
//
// requireRole(...) is a factory that returns middleware checking the user's
// role (decoded from the JWT) against a list of permitted roles.
// ─────────────────────────────────────────────────────────────────────────────

// Track data — all authenticated department users can view the corridor map.
app.use(
  "/api/tracks",
  requireRole("ADMIN", "CONTROLLER", "ENGINEERING", "SNT", "TRACTION"),
  tracksRouter
);

// Maintenance tasks — all roles can access;
// but each role sees/submits only tasks it is authorised for.
// Department isolation is enforced inside the tasks router using requireOwnDepartment().
app.use(
  "/api/tasks",
  requireRole("ADMIN", "CONTROLLER", "ENGINEERING", "SNT", "TRACTION"),
  tasksRouter
);

// Optimization engine — CONTROLLER and ADMIN only.
// Department users cannot trigger or view optimization directly;
// that is the controller's decision-making responsibility.
app.use(
  "/api/optimization",
  requireRole("ADMIN", "CONTROLLER"),
  optimizationRouter
);

// Plan management (weekly/monthly view, approve, reject) — CONTROLLER + ADMIN only.
app.use(
  "/api/plans",
  requireRole("ADMIN", "CONTROLLER"),
  plansRouter
);

// Incidents and emergency advisories — all roles can report a defect,
// but only CONTROLLER and ADMIN can view impact analysis and advisories.
app.use(
  "/api/incidents",
  requireRole("ADMIN", "CONTROLLER", "ENGINEERING", "SNT", "TRACTION"),
  incidentsRouter
);

// AI analysis endpoint — CONTROLLER and ADMIN only.
// Prevents department users from querying the AI directly.
app.use(
  "/api/ai",
  requireRole("ADMIN", "CONTROLLER"),
  aiRouter
);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — Central Error Handler
// Must be the LAST middleware registered.
// Catches any error forwarded via next(error) from route handlers.
// ─────────────────────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
