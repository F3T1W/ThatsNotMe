const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/**
 * Structured logging utility for main process.
 * Supports different log levels and can be configured for dev/prod environments.
 * @module logger
 */
class Logger {
  constructor() {
    const logDir = path.join(app.getPath('userData'), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: path.join(logDir, 'error.log'), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: path.join(logDir, 'combined.log') 
        })
      ]
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  /**
   * Logs an info message.
   * @param {string} message - Log message.
   * @param {any} [data] - Additional data to log.
   */
  info(message, data) {
    this.logger.info(message, { data });
  }

  /**
   * Logs an error message.
   * @param {string} message - Log message.
   * @param {Error|string} error - Error object or message.
   */
  error(message, error) {
    this.logger.error(message, { 
      error: error instanceof Error ? error.stack : error 
    });
  }

  /**
   * Logs a warning message.
   * @param {string} message - Log message.
   * @param {any} [data] - Additional data to log.
   */
  warn(message, data) {
    this.logger.warn(message, { data });
  }

  /**
   * Logs a debug message.
   * @param {string} message - Log message.
   * @param {any} [data] - Additional data to log.
   */
  debug(message, data) {
    this.logger.debug(message, { data });
  }

  /**
   * Creates a child logger with context.
   * @param {Object} context - Context object.
   * @returns {winston.Logger} Child logger.
   */
  child(context) {
    return this.logger.child(context);
  }
}

const logger = new Logger();

module.exports = { logger };
