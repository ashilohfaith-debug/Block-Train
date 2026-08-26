/**
 * ============================================================
 * src/middleware/rbac.js  —  Role-Based Access Control (RBAC)
 * ============================================================
 *
 * PURPOSE
 * -------
 * After authenticateToken() confirms WHO the caller is, this
 * middleware confirms WHAT they are allowed to do.
 *
 * The RailTwin system has five system roles:
 *
 *   ADMIN        – Full access to every endpoint.
 *   CONTROLLER   – Can read all data, approve/reject plans,
 *                  generate advisories.
 *   ENGINEERING  – Can create and manage Engineering tasks only.
 *   SNT          – Can create and manage S&T tasks only.
 *   TRACTION     – Can create and manage Traction tasks only.
 *
 * HOW IT WORKS
 * ------------
 * `requireRole(...roles)` is a factory function.
 * It returns an Express middleware that checks whether the
 * currently authenticated user's role appears in the list of
 * roles that are permitted to call that particular endpoint.
 *
 * Example usage in a router file:
 *
 *   const { requireRole } = require("../middleware/rbac");
 *
 *   // Only ADMIN and CONTROLLER can approve a plan
 *   router.post("/:id/approve", authenticateToken, requireRole("ADMIN","CONTROLLER"), handler);
 *
 *   // All department roles plus CONTROLLER can create tasks
 *   router.post("/", authenticateToken, requireRole("ADMIN","CONTROLLER","ENGINEERING","SNT","TRACTION"), handler);
 *
 * DEPARTMENT TASK ISOLATION
 * --------------------------
 * `requireOwnDepartment` is a stricter middleware that also
 * checks that a department user is only acting on tasks that
 * belong to their own department.  ADMIN and CONTROLLER bypass
 * this check (they have cross-department visibility).
 */

/**
 * Returns an Express middleware function that allows only users
 * whose role is in the provided `allowedRoles` array.
 *
 * @param {...string} allowedRoles - One or more role strings that may access the route.
 * @returns {import("express").RequestHandler}
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // req.user is set by authenticateToken().
    // If this middleware is somehow called without auth middleware before it,
    // treat it as an unauthorized request.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required."
        }
      });
    }

    const userRole = req.user.role; // e.g. "ENGINEERING", "CONTROLLER"

    // Check whether the user's role is in the list of permitted roles.
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message:
            `Access denied. Your role (${userRole}) does not have permission ` +
            `to perform this action. Required roles: ${allowedRoles.join(", ")}.`
        }
      });
    }

    // Role is permitted — continue to the actual route handler.
    next();
  };
}

/**
 * Middleware that ensures department users can only act on tasks
 * belonging to their own department.
 *
 * Rules:
 *  - ADMIN and CONTROLLER skip this check (full cross-department access).
 *  - ENGINEERING can only submit/view ENGINEERING tasks.
 *  - SNT can only submit/view SNT / S&T tasks.
 *  - TRACTION can only submit/view TRACTION tasks.
 *
 * The department is read from `req.body.department` (on write requests)
 * or `req.query.department` (on read requests).  If neither is present,
 * the middleware falls through — individual route handlers are responsible
 * for applying their own department filters.
 *
 * @param {import("express").Request}  req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function requireOwnDepartment(req, res, next) {
  const { role, department: userDept } = req.user;

  // Privileged roles bypass the department isolation check.
  if (role === "ADMIN" || role === "CONTROLLER") {
    return next();
  }

  // Department users must have a verified department in their token.
  if (!userDept) {
    return res.status(403).json({
      success: false,
      error: { code: "DEPARTMENT_REQUIRED", message: "A verified department is required." }
    });
  }

  // Read the department from the request body (POST/PATCH) or query (GET).
  const requestedDept =
    (req.body && req.body.department) ||
    (req.query && req.query.department);

  // If no department is specified in the request, allow it through —
  // the route handler will apply the user's own department as a filter.
  if (!requestedDept) {
    // Inject the user's department as a filter so handlers can apply it.
    req.departmentFilter = userDept;
    return next();
  }

  // Normalise both sides to upper case before comparing.
  const normRequested = String(requestedDept).toUpperCase();
  const normUserDept  = userDept.toUpperCase();

  // Handle the SNT / S&T alias — both strings refer to the same department.
  const sntAliases = ["SNT", "S&T"];
  const isSntMatch =
    sntAliases.includes(normRequested) && sntAliases.includes(normUserDept);

  if (normRequested !== normUserDept && !isSntMatch) {
    return res.status(403).json({
      success: false,
      error: {
        code: "DEPARTMENT_MISMATCH",
        message:
          `You are registered under the '${userDept}' department and cannot ` +
          `submit or access data for the '${requestedDept}' department.`
      }
    });
  }

  next();
}

module.exports = { requireRole, requireOwnDepartment };
