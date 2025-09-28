import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  EnhancedRateLimiterService,
  UserTier,
  RateLimitResult,
} from './enhanced-rate-limiter.service';
import { MetricsService } from '../../monitoring/metrics.service';

// Interface for metrics service
interface IMetricsService {
  recordApiRequest(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
  ): void;
}

interface ExtendedRequest extends Request {
  user?: {
    userId?: string;
    roles?: string[];
    subscriptionTier?: { tier?: string };
    tier?: string;
  };
  userId?: string;
  rateLimitInfo?: unknown;
}

@Injectable()
export class EnhancedRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(EnhancedRateLimitGuard.name);

  constructor(
    private readonly rateLimiter: EnhancedRateLimiterService,
    private readonly metricsService: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ExtendedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    const userId = this.getUserId(request);
    const userTier = this.getUserTier(request);
    const endpoint =
      (request.route as { path: string } | undefined)?.path || request.url;
    const method = request.method;
    const ipAddress = this.getClientIp(request);

    try {
      // Check rate limit
      const rateLimitResult = await this.rateLimiter.checkRateLimit(
        userId || 'anonymous',
        userTier,
        endpoint,
        method,
      );

      // Record API request metrics
      this.metricsService.recordApiRequest(
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
          userId || 'anonymous',
          ipAddress,
          endpoint,
          'Rate limit exceeded',
        );

        // Log rate limit violation
        this.logger.warn(
          `Rate limit exceeded for user ${userId} (${userTier})`,
          {
            userId,
            userTier,
            endpoint,
            method,
            ipAddress,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime,
          },
        );

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
      (request as { rateLimitInfo?: unknown }).rateLimitInfo = rateLimitResult;

      return true;
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 429) {
        throw error;
      }

      // Log error but allow request through (fail open) - fixed error handling
      const errorMessage = error
        ? (error as any).message || String(error)
        : 'Unknown error';
      this.logger.error(`Rate limiting check failed: ${errorMessage}`);
      return true;
    }
  }

  private getUserId(request: ExtendedRequest): string {
    return request.user?.userId || request.userId || 'anonymous';
  }

  private getUserTier(request: ExtendedRequest): UserTier {
    const user = request.user;

    if (!user) return UserTier.FREE;

    // Get tier from user roles or subscription
    return this.rateLimiter.getUserTier(
      user.roles || [],
      user.subscriptionTier?.tier || user.tier,
    );
  }

  private getClientIp(request: ExtendedRequest): string {
    return (
      request.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.get('x-real-ip') ||
      request.ip ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private setRateLimitHeaders(
    response: Response,
    rateLimitResult: RateLimitResult,
  ): void {
    const config = this.rateLimiter.getTierConfig(rateLimitResult.tier);

    response.setHeader('X-RateLimit-Limit', config.requests);
    response.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    response.setHeader(
      'X-RateLimit-Reset',
      Math.floor(rateLimitResult.resetTime.getTime() / 1000),
    );
    response.setHeader('X-RateLimit-Tier', rateLimitResult.tier);

    if (rateLimitResult.retryAfter) {
      response.setHeader('Retry-After', rateLimitResult.retryAfter);
    }

    if (rateLimitResult.isBurstUsed) {
      response.setHeader('X-RateLimit-Burst-Used', 'true');
    }
  }
}
