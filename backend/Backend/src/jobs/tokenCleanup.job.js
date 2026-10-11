const { pool } = require('../config/database');
const logger   = require('../utils/logger');

const startTokenCleanupJob = () => {
  setInterval(async () => {
    try {
      const { rowCount } = await pool.query(
        'DELETE FROM token_blacklist WHERE expires_at < NOW()'
      );
      if (rowCount > 0) {
        logger.info(`Token cleanup: removed ${rowCount} expired tokens`);
      }
    } catch (err) {
      logger.error('Token cleanup job error', err);
    }
  }, 60 * 60 * 1000);
};

module.exports = { startTokenCleanupJob };