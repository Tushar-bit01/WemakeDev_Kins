// Production-grade health check
// Checks: server uptime, DB connectivity, memory usage
// Used by load balancers and monitoring tools (e.g. AWS ALB, UptimeRobot)

const { pool } = require('../config/database');
const logger = require('./logger');

// GET /health
const healthCheck = async (req, res) => {
  const start = Date.now();

  // Check DB connectivity
  let dbStatus = 'ok';
  let dbLatencyMs = null;

  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = 'error';
    logger.error('Health check DB ping failed:', err.message);
  }

  const memUsage = process.memoryUsage();
  const isHealthy = dbStatus === 'ok';

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    response_time_ms: Date.now() - start,
    checks: {
      database: {
        status: dbStatus,
        latency_ms: dbLatencyMs,
      },
      memory: {
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
        rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      },
    },
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // 200 if healthy, 503 if DB is down (so load balancer can pull the instance)
  return res.status(isHealthy ? 200 : 503).json(payload);
};

module.exports = { healthCheck };