import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { EnhancedRateLimiterService, UserTier } from './enhanced-rate-limiter.service';
import { MetricsService } from '../../monitoring/metrics.service';

@Injectable()
export class EnhancedRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedRateLimitGuard.name);

  constructor(
    private readonly rateLimiter: EnhancedRateLimiterService,
    private readonly metricsService: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    const userId = this.getUserId(request);
    const userTier = this.getUserTier(request);
    const endpoint = request.route?.path || request.url;
    const method = request.method;
    const ipAddress = this.getClientIp(request);

    try {
      // Check rate limit
      const rateLimitResult = await this.rateLimiter.checkRateLimit(
        userId,
        userTier,
        endpoint,
        method,
      );

      // Record API request metrics
      await this.metricsService.recordApiRequest(
        endpoint,
        method,
        0, // Will be updated after response
        200, // Default success
      );

      // Set rate limit headers
      this.setRateLimitHeaders(response, rateLimitResult);

      if (!rateLimitResult.allowed) {
        // Record blocked request
        await this.rateLimiter.recordBlockedRequest(
          userId,
          ipAddress,
          endpoint,
          'Rate limit exceeded',
        );

        // Log rate limit violation
        this.logger.warn(`Rate limit exceeded for user ${userId} (${userTier})`, {
          userId,
          userTier,
          endpoint,
          method,
          ipAddress,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        });

        throw new HttpException(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: rateLimitResult.retryAfter,
            tier: userTier,
            limit: this.rateLimiter.getTierConfig(userTier).requests,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Store rate limit info on request for later use
      (request as any).rateLimitInfo = rateLimitResult;

      return true;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw error;
      }

      // Log error but allow request through (fail open)
      this.logger.error('Rate limiting check failed:', error);
      return true;
    }
  }

  private getUserId(request: Request): string {
    return (request as any).user?.id || (request as any).userId || 'anonymous';
  }

  private getUserTier(request: Request): UserTier {
    const user = (request as any).user;

    if (!user) return UserTier.FREE;

    // Get tier from user roles or subscription
    return this.rateLimiter.getUserTier(
      user.roles || [],
      user.subscriptionTier || user.tier,
    );
  }

  private getClientIp(request: Request): string {
    return (
      request.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.get('x-real-ip') ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private setRateLimitHeaders(response: any, rateLimitResult: any): void {
    const config = this.rateLimiter.getTierConfig(rateLimitResult.tier);

    response.setHeader('X-RateLimit-Limit', config.requests);
    response.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    response.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetTime.getTime() / 1000));
    response.setHeader('X-RateLimit-Tier', rateLimitResult.tier);

    if (rateLimitResult.retryAfter) {
      response.setHeader('Retry-After', rateLimitResult.retryAfter);
    }

    if (rateLimitResult.isBurstUsed) {
      response.setHeader('X-RateLimit-Burst-Used', 'true');
    }
  }
}
