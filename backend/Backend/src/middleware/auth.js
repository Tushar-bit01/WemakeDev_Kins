// src/middleware/auth.js
// Security gatekeeper — replaces Auth0 with custom JWT verification

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { pool } = require('../config/database');

// ---------------------------------------------------------------------------
// JWT verification middleware (replaces Auth0's jwtCheck)
// Attaches decoded payload to req.auth for downstream controllers
// ---------------------------------------------------------------------------
const jwtCheck = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });

    // Check if token is blacklisted
    const { rows } = await pool.query(
      'SELECT id FROM token_blacklist WHERE token = $1',
      [token]
    );
    if (rows.length > 0) {
      return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
    }

    req.auth = {
      payload: {
        sub: decoded.sub,
        role: decoded.role,
        email: decoded.email,
      },
      token, // store raw token for logout use
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    logger.error('JWT verification error', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// ---------------------------------------------------------------------------
// Role-based guard — use AFTER jwtCheck
// Usage: router.get('/vendor-only', jwtCheck, requireRole('vendor'), handler)
// ---------------------------------------------------------------------------
const requireRole = (...roles) => (req, res, next) => {
  if (!req.auth?.payload?.role || !roles.includes(req.auth.payload.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
  }
  next();
};

// ---------------------------------------------------------------------------
// Rate limiters (unchanged from your original — kept as-is)
// ---------------------------------------------------------------------------
const createRateLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: message, retryAfter: Math.ceil(windowMs / 1000) });
    },
  });

const apiLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests from this IP, please try again later');
const authLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later');
const strictAuthLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Account temporarily locked due to multiple failed attempts');

// ---------------------------------------------------------------------------
// Input sanitization (unchanged)
// ---------------------------------------------------------------------------
const sanitizeInput = (req, res, next) => {
  const SKIP_TRUNCATE_KEYS = ['photo', 'siteData', 'panelOverride', 'site_data', 'panel_override'];

  const sanitize = (obj, key) => {
    if (typeof obj === 'string') {
      const cleaned = obj.replace(/[<>]/g, '').trim();
      return SKIP_TRUNCATE_KEYS.includes(key) ? cleaned : cleaned.slice(0, 1000);
    }
    if (Array.isArray(obj)) return obj.map(item => sanitize(item, key));
    if (obj && typeof obj === 'object') {
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sanitize(v, k)]));
    }
    return obj;
  };
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  next();
};

// ---------------------------------------------------------------------------
// Content-type guard (unchanged)
// ---------------------------------------------------------------------------
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'];
    if (!ct || !ct.includes('application/json')) {
      return res.status(400).json({ error: 'Invalid content type. Expected application/json' });
    }
  }
  next();
};

// ---------------------------------------------------------------------------
// Security headers (unchanged)
// ---------------------------------------------------------------------------
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// ---------------------------------------------------------------------------
// Suspicious activity logger (unchanged)
// ---------------------------------------------------------------------------
const logSuspiciousActivity = (req, res, next) => {
  const patterns = [/<script>/i, /javascript:/i, /onerror=/i, /onclick=/i, /<iframe>/i, /eval\(/i, /alert\(/i];
  const isSuspicious = (obj) => patterns.some((p) => p.test(JSON.stringify(obj)));
  if (req.body && isSuspicious(req.body)) {
    console.warn('Suspicious request detected:', {
      ip: req.ip, method: req.method, path: req.path,
      userAgent: req.headers['user-agent'], timestamp: new Date().toISOString(),
    });
  }
  next();
};

module.exports = {
  jwtCheck,
  requireRole,
  apiLimiter,
  authLimiter,
  strictAuthLimiter,
  sanitizeInput,
  validateContentType,
  securityHeaders,
  logSuspiciousActivity,
};