/**
 * ============================================================
 * src/middleware/errorHandler.js  —  Central Error Handler
 * ============================================================
 *
 * PURPOSE
 * -------
 * Express requires a 4-argument middleware (err, req, res, next)
 * to act as a "catch-all" error handler.  It must be registered
 * AFTER all other middleware and route definitions in app.js.
 *
 * WHY CENTRALISE ERROR HANDLING?
 * --------------------------------
 * Without this, every controller would need its own try/catch
 * and its own formatting logic.  With this handler:
 *
 *  1. Route handlers call  `next(error)`  whenever something goes wrong.
 *  2. This function catches the error, formats a safe JSON response,
 *     and sends it with the appropriate HTTP status code.
 *
 * SECURITY RULES
 * ---------------
 *  • Stack traces (error.stack) are NEVER sent to clients.
 *    They could reveal internal file paths and library versions,
 *    giving attackers useful reconnaissance information.
 *  • The raw PostgreSQL error message is replaced by a generic
 *    "Database operation failed" string in production.
 *  • Errors are logged server-side with full detail so developers
 *    can diagnose issues without exposing them externally.
 */

/**
 * Central Express error-handling middleware.
 *
 * All errors that reach this handler are formatted into a consistent
 * JSON structure and returned to the caller.
 *
 * @param {Error} err  - The error object passed via next(err).
 * @param {import("express").Request}  req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next - Must be declared even if unused.
 */
function errorHandler(err, req, res, next) {
  // Log the full error on the server side (including stack) so that
  // developers can diagnose the root cause from server logs.
  // IMPORTANT: Do NOT log req.headers["authorization"] — it contains the token.
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
  if (process.env.NODE_ENV !== "production") {
    // In development we also log the stack trace for faster debugging.
    console.error(err.stack);
  }

  // Use a status code set on the error object if available,
  // otherwise fall back to 500 Internal Server Error.
  // Only expose valid HTTP status codes; malformed errors must remain 500s.
  const requestedStatus = Number(err.status || err.statusCode);
  const status = requestedStatus >= 400 && requestedStatus <= 599 ? requestedStatus : 500;

  // Determine a safe error code string.
  // Postgres errors expose a 5-character code (e.g. "23505" = unique violation).
  // We map these to human-readable codes where possible.
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = process.env.NODE_ENV === "production"
    ? "An unexpected server error occurred."
    : (err.message || "An unexpected error occurred.");

  // Handle specific PostgreSQL error codes cleanly.
  if (code === "23505") {
    // Unique constraint violation (e.g. duplicate email on registration)
    code    = "DUPLICATE_ENTRY";
    message = "A record with the same unique value already exists.";
  } else if (code === "23503") {
    // Foreign key violation (e.g. referencing a non-existent section)
    code    = "FOREIGN_KEY_VIOLATION";
    message = "Referenced record does not exist.";
  } else if (typeof code === "string" && /^\d{5}$/.test(code)) {
    // Any other raw Postgres error code — hide internal DB detail from client
    code    = "DATABASE_ERROR";
    message = "A database operation failed.";
  }

  // Never return implementation details for unexpected server failures.
  if (status >= 500 && process.env.NODE_ENV === "production") {
    code = "INTERNAL_SERVER_ERROR";
    message = "An unexpected server error occurred.";
  }

  res.status(status).json({
    success: false,
    error: { code, message }
    // NOTE: error.stack is deliberately omitted from this response.
  });
}

module.exports = { errorHandler };
