const cron = require('node-cron');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const TIMEOUT_MINUTES = 60;

const startAuditTimeoutJob = () => {
    // Runs every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const result = await pool.query(
                `UPDATE audits
                 SET status = 'failed', updated_at = NOW()
                 WHERE status IN ('pending', 'processing')
                 AND created_at < NOW() - INTERVAL '${TIMEOUT_MINUTES} minutes'
                 RETURNING id`
            );

            if (result.rows.length > 0) {
                const ids = result.rows.map(r => r.id).join(', ');
                logger.info(`[AuditTimeoutJob] Marked ${result.rows.length} audit(s) as failed: IDs ${ids}`);
            }
        } catch (error) {
            logger.error('[AuditTimeoutJob] Error running timeout job', { error: error.message });
        }
    });

    logger.info('[AuditTimeoutJob] Audit timeout job started (runs every 5 minutes)');
};

module.exports = { startAuditTimeoutJob };