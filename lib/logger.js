/**
 * Pino Logger Configuration
 * 
 * Configured to output:
 * - Console: Default JSON format (structured logging)
 * - File: Simple text format (human-readable)
 * 
 * Both streams capture the same information, just in different formats.
 */

import pino from 'pino';
import { Writable } from 'stream';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create file stream for text format logging
const fileStream = fs.createWriteStream(path.join(logsDir, 'app.log'), {
  flags: 'a', // Append mode
});

// Helper function to format a log object as text
function formatLogAsText(obj) {
  const timestamp = new Date(obj.time).toISOString();
  const level = obj.level ? pino.levels.labels[obj.level].toUpperCase() : 'INFO';
  const message = obj.msg || '';
  
  // Build log line with all relevant fields
  let formattedLine = `[${timestamp}] [${level}] ${message}`;
  
  // Add additional fields if present (excluding internal Pino fields)
  const extraFields = [];
  const excludeFields = ['time', 'level', 'msg', 'pid', 'hostname', 'env', 'v'];
  
  Object.keys(obj).forEach((key) => {
    if (!excludeFields.includes(key) && obj[key] !== undefined && obj[key] !== null) {
      if (key === 'err') {
        const err = obj.err;
        if (err.message) {
          extraFields.push(`error: ${err.message}`);
        } else if (typeof err === 'string') {
          extraFields.push(`error: ${err}`);
        } else {
          extraFields.push(`error: ${JSON.stringify(err)}`);
        }
      } else if (typeof obj[key] === 'object') {
        extraFields.push(`${key}: ${JSON.stringify(obj[key])}`);
      } else {
        extraFields.push(`${key}: ${obj[key]}`);
      }
    }
  });
  
  if (extraFields.length > 0) {
    formattedLine += ` | ${extraFields.join(' | ')}`;
  }
  
  // Add stack trace if present
  if (obj.err && obj.err.stack) {
    formattedLine += `\n${obj.err.stack}`;
  }
  
  return formattedLine;
}

// Create a custom Writable stream that intercepts writes and formats as text
// Pino's multistream writes JSON strings line by line
const textFormatter = new Writable({
  write(chunk, encoding, callback) {
    try {
      const logString = chunk.toString().trim();
      if (!logString) {
        callback();
        return;
      }
      
      // Parse JSON log entry
      const obj = JSON.parse(logString);
      const formattedLine = formatLogAsText(obj);
      
      // Write formatted text to file
      fileStream.write(formattedLine + '\n', callback);
    } catch (error) {
      // Fallback: write original chunk if parsing fails
      fileStream.write(chunk.toString() + '\n', callback);
    }
  }
});

// Configure logger with multi-stream
// Stream 1: Console with default JSON format
// Stream 2: File with simple text format
const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    base: {
      env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  },
  pino.multistream([
    // Console stream - JSON format (default)
    {
      level: process.env.LOG_LEVEL || 'info',
      stream: process.stdout,
    },
    // File stream - Text format
    {
      level: process.env.LOG_LEVEL || 'info',
      stream: textFormatter,
    },
  ])
);

// Helper function to create child logger with context
export function createLogger(context = {}) {
  return logger.child(context);
}

// Export default logger
export default logger;

