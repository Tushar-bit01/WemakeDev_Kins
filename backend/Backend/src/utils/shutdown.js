// Production graceful shutdown
// Handles SIGTERM (deployed environments / Docker) and SIGINT (Ctrl+C local dev)
// Ensures: in-flight requests finish, DB pool drains, no data loss

const { pool } = require('../config/database');
const logger = require('./logger');

const SHUTDOWN_TIMEOUT_MS = 10000; // Force-exit after 10s if stuck

function registerShutdownHandlers(server) {

  const shutdown = async (signal) => {
    logger.info(`[Shutdown] Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('[Shutdown] HTTP server closed — no new connections accepted');

      try {
        await pool.end();
        logger.info('[Shutdown] PostgreSQL pool drained cleanly');
      } catch (err) {
        logger.error('[Shutdown] Error draining DB pool:', err.message);
      }

      logger.info('[Shutdown] Shutdown complete. Exiting.');
      process.exit(0);
    });

    // Safety net — if shutdown takes too long, force exit
    setTimeout(() => {
      logger.error('[Shutdown] Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref(); // .unref() so the timer doesn't block exit on its own
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // Catch unhandled promise rejections — log and exit cleanly
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('[Process] Unhandled Promise Rejection:', reason);
    // Don't exit here — log and let the process continue unless it's fatal
  });

  // Catch uncaught exceptions — these are fatal, always exit
  process.on('uncaughtException', (err) => {
    logger.error('[Process] Uncaught Exception — exiting:', err);
    process.exit(1);
  });
}

module.exports = { registerShutdownHandlers };