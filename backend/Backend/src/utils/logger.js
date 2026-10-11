const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json()
    ),
    transports: [
        // Write all errors to error.log
        new transports.File({
            filename: path.join(LOG_DIR, 'error.log'),
            level: 'error'
        }),
        // Write all logs to combined.log
        new transports.File({
            filename: path.join(LOG_DIR, 'combined.log')
        }),
    ]
});

// In development, also print to console in a readable format
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, stack }) => {
                return stack
                    ? `${timestamp} [${level}]: ${message}\n${stack}`
                    : `${timestamp} [${level}]: ${message}`;
            })
        )
    }));
}

module.exports = logger;