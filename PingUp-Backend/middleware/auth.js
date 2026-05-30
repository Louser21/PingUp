const { hasPermission, ROLES } = require('../data/store');

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim().length === 0) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

const JWT_SECRET = jwtSecret.trim();

/**
 * @fileoverview Authentication & Authorization Middleware
 * Handles JWT generation/verification, REST API role validation, 
 * and Socket.io connection authentication.
 */

/**
 * Generates a JSON Web Token (JWT) for a given user.
 * @param {Object} user - The user document from MongoDB
 * @returns {string} The signed JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

/**
 * Verifies and decodes a JWT token safely.
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} The decoded token payload, or null if invalid/expired
 */
function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

/**
 * REST Middleware: Ensures the authenticated user meets the minimum role requirement.
 * @param {string} requiredRole - The minimum role weight required (e.g. ROLES.MODERATOR)
 * @returns {Function} Express middleware function
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized: No user role found' });
    }

    if (!hasPermission(req.user.role, requiredRole)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

/**
 * Socket.io Middleware: Authenticates incoming WebSocket connections.
 * Extracts the JWT from `socket.handshake.auth.token`, verifies it, 
 * and attaches the user payload to the `socket` object for future events.
 */
async function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('AUTH_REQUIRED'));
  
  const decoded = verifyToken(token);
  if (!decoded) return next(new Error('INVALID_TOKEN'));
  
  const user = await User.findById(decoded.id);
  if (!user) return next(new Error('USER_NOT_FOUND'));
  
  socket.user = { id: user._id.toString(), username: user.username, role: user.role };
  next();
}

module.exports = {
  requireRole,
  ROLES,
  generateToken,
  verifyToken,
  socketAuthMiddleware
};
