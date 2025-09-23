import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Error Handling Middleware for Queue UI Dashboard
 *
 * Provides centralized error handling with proper logging
 * and user-friendly error responses.
 */
export function errorHandler(error: Error, req: Request, res: Response) {
  // Log the error
  logger.error('Queue UI Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details: string | undefined = undefined;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = isDevelopment ? error.message : undefined;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Not found';
  } else if (error.message.includes('Redis')) {
    statusCode = 503;
    message = 'Queue service temporarily unavailable';
    details = isDevelopment ? error.message : 'Please try again later';
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    details: details || (isDevelopment ? error.message : undefined),
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown',
  });
}

/**
 * 404 Handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response) {
  logger.warn(`404 - Route not found: ${req.method} ${req.url} from ${req.ip}`);

  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.method} ${req.url} was not found`,
    availableRoutes: [
      'GET /health - Health check',
      'GET /api/info - API information',
      'GET / - Queue dashboard (requires authentication)',
    ],
    timestamp: new Date().toISOString(),
  });
}
