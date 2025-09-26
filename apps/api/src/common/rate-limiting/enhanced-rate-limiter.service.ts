import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

export enum UserTier {
  FREE = 'free',
  STANDARD = 'standard',
  ENTERPRISE = 'enterprise',
  ADMIN = 'admin',
}

export interface RateLimitConfig {
  tier: UserTier;
  requests: number;
  windowMs: number; // Time window in milliseconds
  burstAllowance?: number; // Additional burst capacity
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  tier: UserTier;
  isBurstUsed?: boolean;
}

export interface AbuseDetectionResult {
  isAbusive: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  patterns: string[];
  recommendedAction: 'allow' | 'warn' | 'block' | 'ban';
  confidence: number; // 0-1
}

export interface RequestPattern {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent: string;
  ipAddress: string;
}

/**
 * Enhanced Rate Limiter with User Tiers and Abuse Detection
 */
@Injectable()
export class EnhancedRateLimiterService {
  private readonly logger = new Logger(EnhancedRateLimiterService.name);

  // Rate limit configurations by tier
  private readonly tierConfigs: Record<UserTier, RateLimitConfig> = {
    [UserTier.FREE]: {
      tier: UserTier.FREE,
      requests: 60,
      windowMs: 60 * 1000, // 1 minute
      burstAllowance: 10,
    },
    [UserTier.STANDARD]: {
      tier: UserTier.STANDARD,
      requests: 120,
      windowMs: 60 * 1000,
      burstAllowance: 30,
    },
    [UserTier.ENTERPRISE]: {
      tier: UserTier.ENTERPRISE,
      requests: 300,
      windowMs: 60 * 1000,
      burstAllowance: 100,
    },
    [UserTier.ADMIN]: {
      tier: UserTier.ADMIN,
      requests: 1000,
      windowMs: 60 * 1000,
      burstAllowance: 500,
    },
  };

  // Abuse detection patterns
  private readonly abusePatterns = {
    // High-frequency requests to the same endpoint
    endpointFlooding: {
      threshold: 50, // requests per minute
      windowMs: 60 * 1000,
      riskLevel: 'high' as const,
    },

    // Rapid-fire requests across multiple endpoints
    scatterRequests: {
      threshold: 100, // requests per minute
      windowMs: 60 * 1000,
      uniqueEndpoints: 10,
      riskLevel: 'medium' as const,
    },

    // Unusual user agent patterns
    suspiciousUserAgent: {
      patterns: [
        /\b(sqlmap|nmap|nikto|dirbuster|acunetix|burpsuite|owasp|metasploit)\b/i,
        /\b(curl|wget|python|perl|ruby)\b.*\//i, // CLI tools
        /^[^a-zA-Z]*$/, // Empty or non-alphabetic
      ],
      riskLevel: 'high' as const,
    },

    // Failed authentication attempts
    authFailures: {
      threshold: 5, // failures per 15 minutes
      windowMs: 15 * 60 * 1000,
      riskLevel: 'high' as const,
    },

    // Large payload attacks
    oversizedPayloads: {
      threshold: 10 * 1024 * 1024, // 10MB
      riskLevel: 'medium' as const,
    },

    // Time-based anomalies
    offHoursActivity: {
      hours: [2, 3, 4, 5], // 2 AM - 6 AM
      multiplier: 2, // Double the risk during off hours
    },
  };

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis,
  ) {}

  /**
   * Check rate limit for a user
   */
  async checkRateLimit(
    userId: string,
    userTier: UserTier,
    endpoint?: string,
    method?: string,
  ): Promise<RateLimitResult> {
    const config = this.tierConfigs[userTier];

    if (!config) {
      this.logger.warn(`Unknown user tier: ${userTier}, falling back to FREE`);
      return this.checkRateLimit(userId, UserTier.FREE, endpoint, method);
    }

    const key = `ratelimit:${userId}:${config.windowMs}`;
    const burstKey = `ratelimit:burst:${userId}`;

    try {
      // Use Redis atomic operations for rate limiting
      const now = Date.now();
      const windowStart = now - config.windowMs;

      // Get current request count
      const currentCount = await this.redis.zcount(key, windowStart, now);
      const burstCount = parseInt((await this.redis.get(burstKey)) || '0');

      const totalRequests = currentCount + burstCount;
      const allowedRequests = config.requests + (config.burstAllowance || 0);

      let isAllowed = totalRequests < allowedRequests;
      let isBurstUsed = false;

      // If regular limit exceeded, check burst allowance
      if (
        !isAllowed &&
        currentCount >= config.requests &&
        burstCount < (config.burstAllowance || 0)
      ) {
        isAllowed = true;
        isBurstUsed = true;

        // Increment burst counter
        await this.redis.incr(burstKey);
        await this.redis.expire(burstKey, Math.floor(config.windowMs / 1000));
      }

      // Record this request
      await this.redis.zadd(key, now, `${now}:${endpoint}:${method}`);
      await this.redis.expire(key, Math.floor(config.windowMs / 1000) + 60); // Extra minute for cleanup

      // Clean old entries
      await this.redis.zremrangebyscore(key, '-inf', windowStart);

      const remaining = Math.max(0, allowedRequests - totalRequests - 1);
      const resetTime = new Date(now + config.windowMs);

      const result: RateLimitResult = {
        allowed: isAllowed,
        remaining,
        resetTime,
        tier: userTier,
        isBurstUsed,
      };

      if (!isAllowed) {
        result.retryAfter = Math.ceil(config.windowMs / 1000);
      }

      return result;
    } catch (error) {
      this.logger.error('Rate limiting check failed:', error);
      // Fail open - allow request if Redis fails
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + config.windowMs),
        tier: userTier,
      };
    }
  }

  /**
   * Detect potential abuse patterns
   */
  async detectAbuse(
    userId: string,
    ipAddress: string,
    recentRequests: RequestPattern[],
  ): Promise<AbuseDetectionResult> {
    const patterns: string[] = [];
    let riskScore = 0;
    const totalRequests = recentRequests.length;

    // Check endpoint flooding
    const endpointCounts = new Map<string, number>();
    recentRequests.forEach((req) => {
      const key = `${req.method}:${req.endpoint}`;
      endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
    });

    const maxEndpointRequests = Math.max(...endpointCounts.values());
    if (maxEndpointRequests >= this.abusePatterns.endpointFlooding.threshold) {
      patterns.push(
        `Endpoint flooding: ${maxEndpointRequests} requests to same endpoint`,
      );
      riskScore += 0.4;
    }

    // Check scatter requests (requests to many different endpoints)
    const uniqueEndpoints = new Set(recentRequests.map((r) => r.endpoint)).size;
    if (
      uniqueEndpoints >= this.abusePatterns.scatterRequests.uniqueEndpoints &&
      totalRequests >= this.abusePatterns.scatterRequests.threshold
    ) {
      patterns.push(
        `Scatter requests: ${uniqueEndpoints} unique endpoints in ${totalRequests} requests`,
      );
      riskScore += 0.3;
    }

    // Check suspicious user agents
    const suspiciousUA = recentRequests.some((req) =>
      this.abusePatterns.suspiciousUserAgent.patterns.some((pattern) =>
        pattern.test(req.userAgent),
      ),
    );
    if (suspiciousUA) {
      patterns.push('Suspicious user agent detected');
      riskScore += 0.5;
    }

    // Check authentication failures
    const authFailures = recentRequests.filter(
      (req) => req.endpoint.includes('/auth') && req.statusCode === 401,
    ).length;
    if (authFailures >= this.abusePatterns.authFailures.threshold) {
      patterns.push(
        `High authentication failure rate: ${authFailures} failures`,
      );
      riskScore += 0.6;
    }

    // Check oversized payloads
    const oversizedRequests = recentRequests.filter(
      (req) => req.responseTime > 5000, // Slow responses might indicate large processing
    ).length;
    if (oversizedRequests > totalRequests * 0.3) {
      patterns.push(
        'High number of slow requests (possible oversized payloads)',
      );
      riskScore += 0.2;
    }

    // Check off-hours activity
    const currentHour = new Date().getHours();
    const isOffHours =
      this.abusePatterns.offHoursActivity.hours.includes(currentHour);
    if (isOffHours && totalRequests > 10) {
      patterns.push('Unusual off-hours activity');
      riskScore *= this.abusePatterns.offHoursActivity.multiplier;
    }

    // Determine risk level and recommended action
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let recommendedAction: 'allow' | 'warn' | 'block' | 'ban';

    if (riskScore >= 1.5) {
      riskLevel = 'critical';
      recommendedAction = 'ban';
    } else if (riskScore >= 1.0) {
      riskLevel = 'high';
      recommendedAction = 'block';
    } else if (riskScore >= 0.5) {
      riskLevel = 'medium';
      recommendedAction = 'warn';
    } else {
      riskLevel = 'low';
      recommendedAction = 'allow';
    }

    return {
      isAbusive: riskScore >= 0.3,
      riskLevel,
      patterns,
      recommendedAction,
      confidence: Math.min(riskScore, 1.0),
    };
  }

  /**
   * Record a blocked request
   */
  async recordBlockedRequest(
    userId: string,
    ipAddress: string,
    endpoint: string,
    reason: string,
  ): Promise<void> {
    const key = `blocked:${userId}`;

    try {
      await this.redis.zadd(
        key,
        Date.now(),
        JSON.stringify({
          ipAddress,
          endpoint,
          reason,
          timestamp: Date.now(),
        }),
      );

      // Keep only last 100 blocked requests
      await this.redis.zremrangebyrank(key, 0, -101);
      await this.redis.expire(key, 24 * 60 * 60); // 24 hours
    } catch (error) {
      this.logger.error('Failed to record blocked request:', error);
    }
  }

  /**
   * Get user tier based on subscription or role
   */
  getUserTier(userRoles: string[], subscriptionTier?: string): UserTier {
    // Admin users get admin tier
    if (userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN')) {
      return UserTier.ADMIN;
    }

    // Use subscription tier if available
    if (subscriptionTier) {
      switch (subscriptionTier.toLowerCase()) {
        case 'enterprise':
        case 'premium':
          return UserTier.ENTERPRISE;
        case 'standard':
        case 'pro':
          return UserTier.STANDARD;
        case 'free':
        case 'basic':
        default:
          return UserTier.FREE;
      }
    }

    // Default to free tier
    return UserTier.FREE;
  }

  /**
   * Get rate limit configuration for a tier
   */
  getTierConfig(tier: UserTier): RateLimitConfig {
    return this.tierConfigs[tier] || this.tierConfigs[UserTier.FREE];
  }

  /**
   * Get all tier configurations
   */
  getAllTierConfigs(): Record<UserTier, RateLimitConfig> {
    return { ...this.tierConfigs };
  }

  /**
   * Update tier configuration (admin function)
   */
  updateTierConfig(tier: UserTier, config: Partial<RateLimitConfig>): void {
    if (this.tierConfigs[tier]) {
      this.tierConfigs[tier] = { ...this.tierConfigs[tier], ...config };
      this.logger.log(`Updated rate limit config for tier ${tier}:`, config);
    }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  async resetUserLimits(userId: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`ratelimit:*:${userId}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      this.logger.log(`Reset rate limits for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to reset rate limits for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Get rate limit status for a user
   */
  async getUserStatus(
    userId: string,
    tier: UserTier,
  ): Promise<{
    currentUsage: number;
    limit: number;
    remaining: number;
    resetTime: Date;
    burstUsed: number;
    burstLimit: number;
  }> {
    const config = this.tierConfigs[tier];
    const key = `ratelimit:${userId}:${config.windowMs}`;
    const burstKey = `ratelimit:burst:${userId}`;

    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      const currentUsage = await this.redis.zcount(key, windowStart, now);
      const burstUsed = parseInt((await this.redis.get(burstKey)) || '0');

      return {
        currentUsage: currentUsage + burstUsed,
        limit: config.requests + (config.burstAllowance || 0),
        remaining: Math.max(
          0,
          config.requests +
            (config.burstAllowance || 0) -
            currentUsage -
            burstUsed,
        ),
        resetTime: new Date(now + config.windowMs),
        burstUsed,
        burstLimit: config.burstAllowance || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get user status for ${userId}:`, error);
      return {
        currentUsage: 0,
        limit: config.requests,
        remaining: config.requests,
        resetTime: new Date(Date.now() + config.windowMs),
        burstUsed: 0,
        burstLimit: config.burstAllowance || 0,
      };
    }
  }
}
