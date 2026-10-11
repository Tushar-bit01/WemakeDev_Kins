// This creates the Express app, Loads global middleware, registers routes, 
// registers error handlers, Exports the app (for server start or testing)

require('dotenv').config();
require('./config/env');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const paymentRoutes = require('./routes/payments.routes');
const auditRoutes = require('./routes/audit.routes');
const vendorRoutes = require('./routes/vendor.routes');
const subsidyRoutes = require('./routes/subsidy.routes');
const customerRoutes = require('./routes/customer.routes');
const satelliteRoutes = require('./routes/satellite.routes');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { healthCheck } = require('./utils/healthCheck');
const { startAuditTimeoutJob } = require('./jobs/auditTimeout.job');
const { startTokenCleanupJob } = require('./jobs/tokenCleanup.job');
const {
  apiLimiter,
  securityHeaders,
  sanitizeInput,
  validateContentType,
  logSuspiciousActivity,
} = require('./middleware/auth');

const app = express();

// Trust proxy - important for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// ── CORS must be first — before helmet, before everything ─────
// OPTIONS preflight must be handled before validateContentType
// or any middleware that inspects the body/content-type header
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600,
};

app.use(cors(corsOptions));

// Security middleware - Helmet with strict CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Additional security headers
app.use(securityHeaders);

// Body parsing with size limits
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Compression middleware
app.use(compression());

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Custom input sanitization
app.use(sanitizeInput);

// Validate content type for POST/PUT/PATCH — skip OPTIONS preflight
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  if (['GET', 'DELETE', 'HEAD'].includes(req.method)) return next();
  if (!req.headers['content-type']) return next();
  validateContentType(req, res, next);
});

// Log suspicious activities
app.use(logSuspiciousActivity);

// Rate limiting - apply to all routes
app.use(apiLimiter);

// Health check endpoint
app.get('/health', healthCheck);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Solar Backend API',
    status: 'running',
    version: process.env.API_VERSION || '1.0.0',
  });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/audit', auditRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/subsidy', subsidyRoutes);
app.use('/api/customer', require('./routes/customer.routes'));
app.use('/api', satelliteRoutes);

// Start background jobs
startAuditTimeoutJob();
logger.info('Server initialized successfully');

// Logout
startTokenCleanupJob();

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;