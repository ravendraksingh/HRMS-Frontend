/**
 * Pino Logger Configuration
 *
 * Configured to output:
 * - Server-side: Console (JSON) + File (text format)
 * - Client-side: Console only (JSON format)
 *
 * Automatically imports the appropriate logger based on environment.
 */

// Check if we're on the server side
const isServer = typeof window === "undefined";

// Lazy load loggers to avoid bundling server code in client
let _logger = null;
let _createLogger = null;

function getLogger() {
  if (_logger) return _logger;

  if (isServer) {
    // Server-side: Import server logger with file output
    // Using require() to ensure it's only loaded on server
    const serverLogger = require("./logger.server");
    _logger = serverLogger.default || serverLogger;
    _createLogger = serverLogger.createLogger;
  } else {
    // Client-side: Import client logger (console only)
    const clientLogger = require("./logger.client");
    _logger = clientLogger.default || clientLogger;
    _createLogger = clientLogger.createLogger;
  }

  return _logger;
}

// Helper function to create child logger with context
export function createLogger(context = {}) {
  if (!_createLogger) {
    getLogger();
  }
  return _createLogger(context);
}

// Export default logger with lazy initialization
const logger = new Proxy(
  {},
  {
    get(target, prop) {
      const actualLogger = getLogger();
      const value = actualLogger[prop];
      return typeof value === "function" ? value.bind(actualLogger) : value;
    },
  }
);

export default logger;
