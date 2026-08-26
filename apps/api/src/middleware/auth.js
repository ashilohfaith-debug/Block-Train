/**
 * ============================================================
 * src/middleware/auth.js  —  JWT Authentication Middleware
 * ============================================================
 *
 * PURPOSE
 * -------
 * This middleware protects every API route that carries sensitive
 * government railway data.  It reads the JSON Web Token (JWT)
 * from the "Authorization" HTTP header, verifies its cryptographic
 * signature, and attaches the decoded user payload to `req.user`
 * so that downstream route handlers know WHO is making the request.
 *
 * HOW IT WORKS
 * ------------
 *  1. The client must send every protected request with:
 *       Authorization: Bearer <token>
 *
 *  2. The middleware splits off the token string, verifies it
 *     using the secret key stored in JWT_SECRET (environment var).
 *
 *  3. On success  → calls next() so the request continues.
 *  4. On failure  → returns 401 Unauthorized immediately.
 *
 * SECURITY NOTES
 * --------------
 *  • The JWT_SECRET must be a long random string stored only in
 *    the server-side .env file – NEVER hard-coded or committed.
 *  • Tokens expire after JWT_EXPIRES_IN (default 8 hours), forcing
 *    re-authentication and limiting damage if a token is stolen.
 *  • The Authorization header is NEVER logged.
 */

const jwt = require("jsonwebtoken");

// A missing secret must fail closed. Never use a predictable development secret
// because it would let anyone forge access to protected railway data.
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error("JWT_SECRET must be configured with at least 32 characters.");
    error.status = 500;
    error.code = "AUTH_CONFIGURATION_ERROR";
    throw error;
  }
  return secret;
}

/**
 * Verifies the JWT Bearer token attached to an incoming HTTP request.
 *
 * @param {import("express").Request}  req  - Express request object.
 * @param {import("express").Response} res  - Express response object.
 * @param {import("express").NextFunction} next - Calls the next middleware.
 */
function authenticateToken(req, res, next) {
  // Read the full "Authorization" header value, e.g. "Bearer eyJ..."
  const authHeader = req.headers["authorization"];

  // The token lives after the "Bearer " prefix.
  // If the header is missing or has no space, token will be undefined.
  const tokenParts = typeof authHeader === "string" ? authHeader.trim().split(/\s+/) : [];
  const token = tokenParts.length === 2 && tokenParts[0].toLowerCase() === "bearer"
    ? tokenParts[1]
    : null;

  // If there is no token at all, refuse the request immediately.
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message:
          "Access denied. No authentication token provided. " +
          "Please log in at POST /api/auth/login to obtain a token."
      }
    });
  }

  // Verify the token's signature and expiry using the server-side secret.
  // jwt.verify() throws on any failure (expired, tampered, wrong secret, etc.)
  let secret;
  try {
    secret = getJwtSecret();
  } catch (error) {
    return next(error);
  }

  jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: "railway-block-planning-api",
    audience: "railway-block-planning-client"
  }, (err, decoded) => {
    if (err) {
      // Distinguish between an expired token and a completely invalid one
      // so the client knows whether to try re-logging-in or not.
      const isExpired = err.name === "TokenExpiredError";
      return res.status(401).json({
        success: false,
        error: {
          code: isExpired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
          message: isExpired
            ? "Your session has expired. Please log in again."
            : "Invalid authentication token. Access denied."
        }
      });
    }

    // Token is valid.  Attach the decoded user object (id, email, role,
    // department) to the request so later handlers can use it.
    req.user = decoded;

    // Continue to the next middleware / route handler.
    next();
  });
}

module.exports = { authenticateToken };
