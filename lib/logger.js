// lib/logger.js
// Structured logging utility with JSON format for production observability

const winston = require('winston');

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'marhaba-backend', environment: process.env.NODE_ENV || 'development' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      )
    })
  ]
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: '/tmp/error.log',
      level: 'error',
      format: winston.format.json()
    })
  );
  logger.add(
    new winston.transports.File({
      filename: '/tmp/combined.log',
      format: winston.format.json()
    })
  );
}

module.exports = logger;
