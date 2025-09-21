import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RATE_LIMIT_MESSAGES } from './throttler.config';

/**
 * Custom Throttler Guard for WellFlow API
 *
 * Extends the default NestJS ThrottlerGuard to provide:
 * - Enhanced logging for security monitoring
 * - Custom error messages based on endpoint type
 * - Integration with audit logging system
 * - Compliance with oil & gas security standards
 */
@Injectable()
export class WellFlowThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(WellFlowThrottlerGuard.name);

  protected override async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: { limit: number; ttl: number; totalHits: number },
  ): Promise<void> {
    // Satisfy async requirement for base class compatibility
    await Promise.resolve();

    const request = context.switchToHttp().getRequest<{
      ip?: string;
      connection?: { remoteAddress?: string };
      get: (header: string) => string | undefined;
      method: string;
      url: string;
      user?: { id?: string };
    }>();
    const response = context.switchToHttp().getResponse<{
      header: (name: string, value: string | number) => void;
    }>();

    // Extract request information for logging
    const clientIp = request.ip || request.connection?.remoteAddress;
    const userAgent = request.get('User-Agent') || 'Unknown';
    const endpoint = `${request.method} ${request.url}`;
    const userId = request.user?.id || 'anonymous';

    // Log rate limiting event for security monitoring
    this.logger.warn(
      `Rate limit exceeded - IP: ${clientIp}, User: ${userId}, Endpoint: ${endpoint}, UA: ${userAgent}`,
      {
        event: 'rate_limit_exceeded',
        clientIp,
        userId,
        endpoint,
        userAgent,
        limit: throttlerLimitDetail.limit,
        ttl: throttlerLimitDetail.ttl,
        timestamp: new Date().toISOString(),
      },
    );

    // Use default message for all throttler types
    const message: string = RATE_LIMIT_MESSAGES.DEFAULT;

    // Set rate limiting headers for client information
    const resetTime = Date.now() + throttlerLimitDetail.ttl;
    response.header('X-RateLimit-Limit', throttlerLimitDetail.limit);
    response.header('X-RateLimit-Remaining', '0');
    response.header(
      'X-RateLimit-Reset',
      Math.ceil(resetTime / 1000).toString(),
    );
    response.header(
      'Retry-After',
      Math.ceil(throttlerLimitDetail.ttl / 1000).toString(),
    );

    // Throw custom exception with enhanced details
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message,
        details: {
          limit: throttlerLimitDetail.limit,
          windowMs: throttlerLimitDetail.ttl,
          retryAfter: Math.ceil(throttlerLimitDetail.ttl / 1000),
        },
        timestamp: new Date().toISOString(),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    // Enhanced tracking that considers both IP and user ID
    const user = req.user as { id?: string } | undefined;
    const userId = user?.id;
    const ip = req.ip as string | undefined;
    const connection = req.connection as { remoteAddress?: string } | undefined;
    const clientIp = ip || connection?.remoteAddress || 'unknown';

    // If user is authenticated, use user ID for more accurate rate limiting
    // Otherwise, fall back to IP-based rate limiting
    return Promise.resolve(userId ? `user:${userId}` : `ip:${clientIp}`);
  }

  protected override async shouldSkip(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      get: (header: string) => string | undefined;
    }>();

    // Skip rate limiting for internal health checks from localhost
    if (request.ip === '127.0.0.1' || request.ip === '::1') {
      const userAgent = request.get('User-Agent') || '';

      // Skip for common monitoring tools
      if (
        userAgent.includes('kube-probe') ||
        userAgent.includes('health-check') ||
        userAgent.includes('monitoring')
      ) {
        return true;
      }
    }

    return super.shouldSkip(context);
  }
}
