/**
 * Client-side Pino Logger Configuration
 * 
 * This file is client-only and does not use any Node.js modules.
 * It only logs to the browser console in JSON format.
 */

import pino from 'pino';

// Client-side: Console only logger (no file output)
const logger = pino({
  level: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  browser: {
    asObject: false, // Output as JSON string to console
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

// Helper function to create child logger with context
export function createLogger(context = {}) {
  return logger.child(context);
}

// Export default logger
export default logger;

