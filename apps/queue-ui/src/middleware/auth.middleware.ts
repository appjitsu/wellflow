import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    organizationId?: string;
  };
}

/**
 * Authentication Middleware for Queue UI Dashboard
 *
 * Validates JWT tokens from the main WellFlow API.
 * Only allows access to users with appropriate permissions.
 *
 * Security Features:
 * - JWT token validation
 * - Role-based access control
 * - Request logging for audit trails
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void | Response {
  // Skip authentication for health check, API info endpoints, static assets, and Bull Board API
  if (
    req.path === '/health' ||
    req.path === '/api/info' ||
    req.path.startsWith('/static/') ||
    req.path.startsWith('/api/queues') ||
    req.path.startsWith('/api/redis/') ||
    req.path.startsWith('/api/jobs/')
  ) {
    return next();
  }

  // Extract token from Authorization header or query parameter
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    logger.warn(`Unauthorized access attempt to ${req.path} from ${req.ip}`);
    return res.status(401).json({
      error: 'Authentication required',
      message:
        'Please provide a valid JWT token via Authorization header or ?token= query parameter',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id?: string;
      sub?: string;
      email?: string;
      roles: string[];
      organizationId?: string;
      [key: string]: unknown;
    };

    // Check if user has required permissions
    if (!decoded.roles || !Array.isArray(decoded.roles)) {
      logger.warn(`Invalid token structure from ${req.ip}: missing roles`);
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token does not contain valid role information',
        timestamp: new Date().toISOString(),
      });
    }

    // Check for admin or operator roles
    const allowedRoles = ['ADMIN', 'OPERATOR', 'MANAGER'];
    const hasPermission = decoded.roles.some((role: string) => allowedRoles.includes(role));

    if (!hasPermission) {
      logger.warn(`Access denied for user ${decoded.id} with roles ${decoded.roles.join(', ')}`);
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Queue monitoring requires ADMIN, OPERATOR, or MANAGER role',
        allowedRoles,
        userRoles: decoded.roles,
        timestamp: new Date().toISOString(),
      });
    }

    // Attach user info to request
    const userId = decoded.id || decoded.sub;
    const userEmail = decoded.email;

    if (!userId || !userEmail) {
      logger.warn(`Invalid token structure from ${req.ip}: missing required user fields`);
      return res.status(403).json({
        error: 'Invalid token',
        message: 'Token does not contain required user information',
        timestamp: new Date().toISOString(),
      });
    }

    req.user = {
      id: userId,
      email: userEmail,
      roles: decoded.roles,
      organizationId: decoded.organizationId,
    };

    // Log successful authentication
    logger.info(
      `Authenticated user ${req.user.email} (${req.user.roles.join(', ')}) accessing ${req.path}`
    );

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn(`Expired token from ${req.ip}`);
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please obtain a new authentication token',
        timestamp: new Date().toISOString(),
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Invalid token from ${req.ip}: ${error.message}`);
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Please provide a valid JWT token',
        timestamp: new Date().toISOString(),
      });
    } else {
      const errorDetails =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: String(error) };
      logger.error('Authentication error:', errorDetails);
      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred while validating your token',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

/**
 * Optional middleware to check for specific roles
 */
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));

    if (!hasRole) {
      logger.warn(
        `Role check failed for user ${req.user.email}: required ${roles.join(' or ')}, has ${req.user.roles.join(', ')}`
      );
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
        requiredRoles: roles,
        userRoles: req.user.roles,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['ADMIN']);
