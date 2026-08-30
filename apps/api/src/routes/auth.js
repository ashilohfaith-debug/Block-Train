/**
 * ============================================================
 * src/routes/auth.js  —  Authentication Endpoints
 * ============================================================
 *
 * PURPOSE
 * -------
 * Provides two public endpoints:
 *
 *   POST /api/auth/register
 *       Creates a new RailTwin user account.
 *       The password is hashed with bcrypt before storage —
 *       the plaintext password is NEVER saved in the database.
 *
 *   POST /api/auth/login
 *       Verifies the user's email + password, then issues a
 *       signed JWT that the client must send on every subsequent
 *       request inside the "Authorization: Bearer <token>" header.
 *
 * ROLES SUPPORTED
 * ---------------
 *   ADMIN, CONTROLLER, ENGINEERING, SNT, TRACTION
 *
 * The role is chosen at registration time.  In a production system
 * an ADMIN would approve role assignments; for this hackathon the
 * role is trusted from the registration body.
 *
 * SECURITY DECISIONS
 * ------------------
 *  • bcrypt work factor 12 – strong enough to slow brute-force
 *    attacks even on powerful hardware.
 *  • JWT is signed with JWT_SECRET from .env; never hard-coded.
 *  • The raw password is never logged or returned in a response.
 *  • On login failure the response deliberately uses the same
 *    generic message for "user not found" and "wrong password"
 *    so an attacker cannot enumerate registered email addresses.
 */

const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const crypto   = require("crypto");
const pool     = require('../core/db');
const { logAction } = require('../core/services/auditService');

const router = express.Router();

// ── Allowed roles ────────────────────────────────────────────────────────────
// Any value outside this list is rejected at registration time.
const VALID_ROLES = ["ADMIN", "CONTROLLER", "ENGINEERING", "SNT", "TRACTION"];
const DEPARTMENT_ROLES = ["ENGINEERING", "SNT", "TRACTION"];

// Registration is invite-only so an outsider cannot create a privileged account.
function hasValidRegistrationCode(req) {
  const configuredCode = process.env.REGISTRATION_INVITE_CODE;
  const suppliedCode = req.get("x-registration-code");
  if (!configuredCode || !suppliedCode) return false;

  const expected = Buffer.from(configuredCode);
  const supplied = Buffer.from(suppliedCode);
  return expected.length === supplied.length && crypto.timingSafeEqual(expected, supplied);
}

// ── Helper: sign a JWT ───────────────────────────────────────────────────────
/**
 * Creates a signed JWT for the given user object.
 * The token payload contains only non-sensitive identity fields —
 * NOT the password hash.
 *
 * @param {Object} user - User record from the database.
 * @returns {string} Signed JWT string.
 */
function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error("JWT_SECRET must be configured with at least 32 characters.");
    error.status = 500;
    error.code = "AUTH_CONFIGURATION_ERROR";
    throw error;
  }

  return jwt.sign(
    {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      role:       user.role,
      department: user.department   // same as role for department users
    },
    // The secret must be kept server-side only.
    secret,
    {
      // Token lifespan — default 8 hours.  Users must re-login after expiry.
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      algorithm: "HS256",
      issuer: "railway-block-planning-api",
      audience: "railway-block-planning-client"
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Creates a new user account and returns a JWT for immediate use.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    // The invite code is kept in the server environment and is never returned.
    if (!hasValidRegistrationCode(req)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "REGISTRATION_NOT_ALLOWED",
          message: "An approved registration invitation is required."
        }
      });
    }

    // ── 1. Input validation ───────────────────────────────────────────────────
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "name, email, password, and role are all required."
        }
      });
    }

    // Validate that the requested role exists in our allowed list.
    const roleUpper = role.toUpperCase();
    if (!VALID_ROLES.includes(roleUpper)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_ROLE",
          message: `Role must be one of: ${VALID_ROLES.join(", ")}.`
        }
      });
    }

    // Public registration can create department staff only; administrators and
    // controllers must be provisioned by an existing trusted administrator.
    if (!DEPARTMENT_ROLES.includes(roleUpper)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "PRIVILEGED_ROLE_REQUIRES_ADMIN",
          message: "ADMIN and CONTROLLER accounts must be provisioned by an administrator."
        }
      });
    }

    const departmentUpper = String(department || "").toUpperCase();
    if (departmentUpper !== roleUpper && !(roleUpper === "SNT" && departmentUpper === "S&T")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "DEPARTMENT_ROLE_MISMATCH",
          message: "The verified department must match the selected department role."
        }
      });
    }

    // Basic email format check.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_EMAIL", message: "A valid email address is required." }
      });
    }

    // Enforce a minimum password length.
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: "WEAK_PASSWORD",
          message: "Password must be at least 8 characters long."
        }
      });
    }

    // ── 2. Uniqueness check ───────────────────────────────────────────────────
    // Prevent duplicate accounts for the same email address.
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: "EMAIL_ALREADY_REGISTERED",
          message: "An account with this email address already exists."
        }
      });
    }

    // ── 3. Hash the password ──────────────────────────────────────────────────
    // bcrypt work factor 12 generates a slow, salted hash.
    // Even if the database is compromised, raw passwords remain unrecoverable.
    const passwordHash = await bcrypt.hash(password, 12);

    // ── 4. Persist the user ───────────────────────────────────────────────────
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password_hash, role, department)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, role, department, created_at
      `,
      [
        name.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        roleUpper,
        // Store the verified department used by every later authorization check.
        departmentUpper
      ]
    );
    const user = result.rows[0];

    // ── 5. Issue a JWT ────────────────────────────────────────────────────────
    const token = signToken(user);

    // ── 6. Audit log ──────────────────────────────────────────────────────────
    await logAction("SYSTEM", "USER_REGISTERED", "users", user.id, null, roleUpper,
      `New user registered: ${user.email} with role ${roleUpper}`);

    // Return the token; the client stores it and sends it with future requests.
    // NEVER include the password_hash in the response.
    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department
      }
    });

  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Validates credentials and returns a JWT.
// ─────────────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── 1. Basic field presence check ─────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_CREDENTIALS",
          message: "email and password are required."
        }
      });
    }

    // ── 2. Look up the user by email ──────────────────────────────────────────
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    // SECURITY: Use an identical error message for both "not found" and
    // "wrong password" to prevent email enumeration attacks.
    const genericAuthError = {
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password."
      }
    };

    if (result.rows.length === 0) {
      // User not found — return the generic message (not "user does not exist")
      return res.status(401).json(genericAuthError);
    }

    const user = result.rows[0];

    // ── 3. Verify the password against the stored hash ────────────────────────
    // bcrypt.compare() is timing-safe: it always takes the same amount of time
    // regardless of whether the match succeeds or fails.
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      // Wrong password — same generic message as above.
      return res.status(401).json(genericAuthError);
    }

    // ── 4. Sign and return the token ──────────────────────────────────────────
    const token = signToken(user);

    // Audit the login event (not the password).
    await logAction("SYSTEM", "USER_LOGIN", "users", user.id, null, null,
      `User ${user.email} (${user.role}) logged in.`);

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        role:       user.role,
        department: user.department
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
