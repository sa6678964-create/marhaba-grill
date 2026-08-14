// lib/auth.js
// Authentication utilities for admin endpoints

const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  logger.error('ADMIN_JWT_SECRET is not set or too short (min 32 chars)');
}

/**
 * Verify JWT token and extract payload
 */
function verifyToken(token) {
  try {
    if (!token) throw new Error('Token is required');
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return { valid: true, payload: decoded };
  } catch (error) {
    logger.warn('JWT verification failed', { error: error.message });
    return { valid: false, error: error.message };
  }
}

/**
 * Generate JWT token for admin
 */
function generateToken(payload, expiresIn = '8h') {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn
    });
    return { success: true, token };
  } catch (error) {
    logger.error('Token generation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Extract token from Authorization header
 */
function extractToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Middleware to verify admin authentication
 */
function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractToken(authHeader);

  if (!token) {
    logger.warn('Missing authorization token', { path: req.path, ip: req.ip });
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const result = verifyToken(token);
  if (!result.valid) {
    logger.warn('Invalid authorization token', { path: req.path, ip: req.ip, error: result.error });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  req.admin = result.payload;
  next();
}

module.exports = {
  verifyToken,
  generateToken,
  extractToken,
  adminAuthMiddleware
};
