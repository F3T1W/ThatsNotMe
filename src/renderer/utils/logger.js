/**
 * Structured logging utility for renderer process.
 * Wraps console methods but follows the same interface as main logger.
 * @module renderer-logger
 */
class RendererLogger {
  /**
   * Logs an info message.
   * @param {string} message - Log message.
   * @param {any} [data] - Additional data to log.
   */
  info(message, data) {
    console.log(`[INFO] ${message}`, data || '');
  }

  /**
   * Logs an error message.
   * @param {string} message - Log message.
   * @param {Error|string} error - Error object or message.
   */
  error(message, error) {
    console.error(`[ERROR] ${message}`, error);
  }

  /**
   * Logs a warning message.
   * @param {string} message - Log message.
   * @param {any} [data] - Additional data to log.
   */
  warn(message, data) {
    console.warn(`[WARN] ${message}`, data || '');
  }

  /**
   * Logs a debug message.
   * @param {string} message - Log message.
   * @param {any} [data] - Additional data to log.
   */
  debug(message, data) {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
}

module.exports = { logger: new RendererLogger() };
