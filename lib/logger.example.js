/**
 * Example usage of the Pino logger
 * 
 * This file demonstrates how to use the logger in your Next.js application.
 * You can import and use it in API routes, server components, or middleware.
 */

import logger from './logger';
import { createLogger } from './logger';

// Basic usage
logger.info('Application started');
logger.warn('This is a warning');
logger.error('This is an error');

// Logging with additional context
logger.info({ userId: 123, action: 'login' }, 'User logged in');
logger.error({ err: new Error('Database connection failed'), statusCode: 500 }, 'Request failed');

// Create child logger with context (useful for request-specific logging)
const requestLogger = createLogger({ 
  requestId: 'req-123',
  userId: 456,
  path: '/api/employees'
});

requestLogger.info('Processing request');
requestLogger.error({ err: new Error('Not found') }, 'Resource not found');

// Example in API route:
// import logger from '@/lib/logger';
// 
// export async function GET(req) {
//   const requestLogger = logger.child({ path: req.nextUrl.pathname });
//   try {
//     requestLogger.info('Handling GET request');
//     // ... your code
//     requestLogger.info({ statusCode: 200 }, 'Request completed');
//   } catch (error) {
//     requestLogger.error({ err: error }, 'Request failed');
//   }
// }

