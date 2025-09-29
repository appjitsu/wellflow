import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

// Constants
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export interface DDoSAttackPattern {
  type: 'volumetric' | 'protocol' | 'application';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  indicators: string[];
  recommendedAction: 'monitor' | 'throttle' | 'block' | 'ban';
}

export interface DDoSDetectionResult {
  isAttack: boolean;
  patterns: DDoSAttackPattern[];
  riskScore: number; // 0-100
  ipAddress: string;
  timestamp: Date;
}

export interface DDoSMitigationAction {
  type: 'ip_block' | 'rate_limit' | 'challenge' | 'ban';
  duration: number; // milliseconds
  reason: string;
  ipAddress: string;
}

/**
 * Enhanced DDoS Protection Service
 *
 * Provides advanced DDoS attack detection and automatic mitigation
 * for critical oil & gas operations infrastructure.
 */
@Injectable()
export class DDoSProtectionService {
  private readonly logger = new Logger(DDoSProtectionService.name);

  // DDoS detection thresholds
  private readonly detectionThresholds = {
    // Volumetric attacks - high request volume
    volumetric: {
      requestsPerSecond: 100,
      requestsPerMinute: 1000,
      requestsPerHour: 10000,
      riskLevel: 'high' as const,
    },

    // Protocol attacks - malformed requests
    protocol: {
      malformedRequestsPerMinute: 10,
      invalidHeadersPerMinute: 20,
      riskLevel: 'medium' as const,
    },

    // Application layer attacks - targeting specific endpoints
    application: {
      sameEndpointPerMinute: 200,
      errorRateThreshold: 0.5, // 50% error rate
      slowRequestsPerMinute: 50,
      riskLevel: 'high' as const,
    },

    // Geographic anomalies
    geographic: {
      newCountriesPerHour: 10,
      suspiciousCountries: ['CN', 'RU', 'KP'], // High-risk countries
      riskLevel: 'medium' as const,
    },

    // Behavioral patterns
    behavioral: {
      noUserAgentPerMinute: 50,
      scriptedBehaviorScore: 0.8,
      botPatternScore: 0.7,
      riskLevel: 'medium' as const,
    },
  };

  // Mitigation configurations
  private readonly mitigationConfig = {
    ipBlock: {
      duration: 15 * 60 * 1000, // 15 minutes
      maxBlocks: 1000, // Maximum IPs to block simultaneously
    },
    rateLimitReduction: {
      factor: 0.1, // Reduce rate limits to 10% during attack
      duration: 5 * 60 * 1000, // 5 minutes
    },
    challenge: {
      duration: 60 * 1000, // 1 minute
      difficulty: 'medium',
    },
  };

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis | null,
  ) {}

  /**
   * Analyze request patterns for DDoS attacks
   */
  async analyzeRequest(
    ipAddress: string,
    endpoint: string,
    method: string,
    userAgent: string,
    statusCode: number,
    responseTime: number,
  ): Promise<DDoSDetectionResult> {
    const patterns: DDoSAttackPattern[] = [];
    let riskScore = 0;

    try {
      // Check volumetric patterns
      const volumetricPattern = await this.checkVolumetricAttack(ipAddress);
      if (volumetricPattern) {
        patterns.push(volumetricPattern);
        riskScore += 30;
      }

      // Check protocol patterns
      const protocolPattern = this.checkProtocolAttack(
        ipAddress,
        userAgent,
        statusCode,
      );
      if (protocolPattern) {
        patterns.push(protocolPattern);
        riskScore += 20;
      }

      // Check application layer patterns
      const applicationPattern = await this.checkApplicationAttack(
        ipAddress,
        endpoint,
        method,
        statusCode,
        responseTime,
      );
      if (applicationPattern) {
        patterns.push(applicationPattern);
        riskScore += 25;
      }

      // Check behavioral patterns
      const behavioralPattern = this.checkBehavioralAttack(
        ipAddress,
        userAgent,
      );
      if (behavioralPattern) {
        patterns.push(behavioralPattern);
        riskScore += 15;
      }

      const isAttack = riskScore >= 50 || patterns.length >= 2;

      return {
        isAttack,
        patterns,
        riskScore: Math.min(riskScore, 100),
        ipAddress,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error analyzing DDoS patterns', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
        endpoint,
      });

      // Return safe default
      return {
        isAttack: false,
        patterns: [],
        riskScore: 0,
        ipAddress,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Apply automatic mitigation measures
   */
  async applyMitigation(
    detectionResult: DDoSDetectionResult,
  ): Promise<DDoSMitigationAction[]> {
    const actions: DDoSMitigationAction[] = [];

    if (!detectionResult.isAttack || !this.redis) {
      return actions;
    }

    try {
      const { ipAddress, riskScore, patterns } = detectionResult;

      // Determine mitigation strategy based on risk score and patterns
      if (riskScore >= 80) {
        // High risk - immediate IP ban
        const banAction: DDoSMitigationAction = {
          type: 'ban',
          duration: 60 * 60 * 1000, // 1 hour
          reason: `Critical DDoS attack detected (risk: ${riskScore})`,
          ipAddress,
        };

        await this.blockIP(ipAddress, banAction.duration, banAction.reason);
        actions.push(banAction);
      } else if (riskScore >= 60) {
        // Medium-high risk - temporary block
        const blockAction: DDoSMitigationAction = {
          type: 'ip_block',
          duration: this.mitigationConfig.ipBlock.duration,
          reason: `DDoS attack patterns detected (risk: ${riskScore})`,
          ipAddress,
        };

        await this.blockIP(ipAddress, blockAction.duration, blockAction.reason);
        actions.push(blockAction);
      } else if (riskScore >= 40) {
        // Medium risk - rate limiting
        const rateLimitAction: DDoSMitigationAction = {
          type: 'rate_limit',
          duration: this.mitigationConfig.rateLimitReduction.duration,
          reason: `Suspicious patterns detected (risk: ${riskScore})`,
          ipAddress,
        };

        await this.applyRateLimitReduction(ipAddress, rateLimitAction.duration);
        actions.push(rateLimitAction);
      }

      // Log mitigation actions
      this.logger.warn('DDoS mitigation applied', {
        ipAddress,
        riskScore,
        patterns: patterns.map((p) => p.type),
        actions: actions.map((a) => a.type),
      });

      return actions;
    } catch (error) {
      this.logger.error('Error applying DDoS mitigation', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress: detectionResult.ipAddress,
      });
      return actions;
    }
  }

  /**
   * Check if IP is currently blocked
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const blockKey = `ddos:block:${ipAddress}`;
      const isBlocked = await this.redis.exists(blockKey);
      return isBlocked === 1;
    } catch (error) {
      this.logger.error('Error checking IP block status', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return false;
    }
  }

  /**
   * Get current DDoS statistics
   */
  async getDDoSStats(): Promise<{
    blockedIPs: number;
    activeAttacks: number;
    mitigationActions: number;
  }> {
    if (!this.redis) {
      return { blockedIPs: 0, activeAttacks: 0, mitigationActions: 0 };
    }

    try {
      const [blockedIPs, activeAttacks, mitigationActions] = await Promise.all([
        this.redis.keys('ddos:block:*').then((keys) => keys.length),
        this.redis.keys('ddos:attack:*').then((keys) => keys.length),
        this.redis.keys('ddos:mitigation:*').then((keys) => keys.length),
      ]);

      return { blockedIPs, activeAttacks, mitigationActions };
    } catch (error) {
      this.logger.error('Error getting DDoS stats', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
      return { blockedIPs: 0, activeAttacks: 0, mitigationActions: 0 };
    }
  }

  /**
   * Check for volumetric attack patterns
   */
  private async checkVolumetricAttack(
    ipAddress: string,
  ): Promise<DDoSAttackPattern | null> {
    if (!this.redis) return null;

    try {
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;
      const oneHourAgo = now - 60 * 60 * 1000;

      const requestKey = `ddos:requests:${ipAddress}`;

      // Count requests in different time windows
      const [requestsLastMinute, requestsLastHour] = await Promise.all([
        this.redis.zcount(requestKey, oneMinuteAgo, now),
        this.redis.zcount(requestKey, oneHourAgo, now),
      ]);

      const { volumetric } = this.detectionThresholds;

      if (
        requestsLastMinute > volumetric.requestsPerMinute ||
        requestsLastHour > volumetric.requestsPerHour
      ) {
        return {
          type: 'volumetric',
          severity: 'high',
          confidence: 0.9,
          indicators: [
            `${requestsLastMinute} requests/minute`,
            `${requestsLastHour} requests/hour`,
          ],
          recommendedAction: 'block',
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error checking volumetric attack', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return null;
    }
  }

  /**
   * Check for protocol attack patterns
   */
  private checkProtocolAttack(
    _ipAddress: string,
    userAgent: string,
    statusCode: number,
  ): DDoSAttackPattern | null {
    const indicators: string[] = [];
    let confidence = 0;

    // Check for missing or suspicious user agent
    if (!userAgent || userAgent.trim().length === 0) {
      indicators.push('Missing User-Agent header');
      confidence += 0.3;
    }

    // Check for bot-like user agents
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
    ];
    if (botPatterns.some((pattern) => pattern.test(userAgent))) {
      indicators.push('Bot-like User-Agent');
      confidence += 0.2;
    }

    // Check for high error rates (potential protocol abuse)
    if (statusCode >= 400) {
      indicators.push(`HTTP ${statusCode} error`);
      confidence += 0.1;
    }

    if (confidence >= 0.4) {
      return {
        type: 'protocol',
        severity: confidence >= 0.7 ? 'high' : 'medium',
        confidence,
        indicators,
        recommendedAction: confidence >= 0.7 ? 'block' : 'throttle',
      };
    }

    return null;
  }

  /**
   * Check for application layer attack patterns
   */
  private async checkApplicationAttack(
    ipAddress: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
  ): Promise<DDoSAttackPattern | null> {
    if (!this.redis) return null;

    try {
      const now = Date.now();
      const oneMinuteAgo = now - 60 * 1000;

      const endpointKey = `ddos:endpoint:${ipAddress}:${endpoint}`;
      const requestsToEndpoint = await this.redis.zcount(
        endpointKey,
        oneMinuteAgo,
        now,
      );

      const { application } = this.detectionThresholds;

      const indicators: string[] = [];
      let confidence = 0;

      // Check for endpoint flooding
      if (requestsToEndpoint > application.sameEndpointPerMinute) {
        indicators.push(
          `${requestsToEndpoint} requests to ${endpoint} in 1 minute`,
        );
        confidence += 0.4;
      }

      // Check for slow requests (potential slowloris attack)
      if (responseTime > 5000) {
        // > 5 seconds
        indicators.push(`Slow response time: ${responseTime}ms`);
        confidence += 0.2;
      }

      // Check for error patterns
      if (statusCode >= 500) {
        indicators.push(`Server error: ${statusCode}`);
        confidence += 0.3;
      }

      if (confidence >= 0.4) {
        return {
          type: 'application',
          severity: confidence >= 0.7 ? 'high' : 'medium',
          confidence,
          indicators,
          recommendedAction: confidence >= 0.6 ? 'block' : 'throttle',
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error checking application attack', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
        endpoint,
      });
      return null;
    }
  }

  /**
   * Check for behavioral attack patterns
   */
  private checkBehavioralAttack(
    _ipAddress: string,
    userAgent: string,
  ): DDoSAttackPattern | null {
    const indicators: string[] = [];
    let confidence = 0;

    // Check for scripted behavior patterns
    const scriptedPatterns = [
      /python/i,
      /java/i,
      /go-http-client/i,
      /okhttp/i,
      /apache-httpclient/i,
    ];

    if (scriptedPatterns.some((pattern) => pattern.test(userAgent))) {
      indicators.push('Scripted user agent detected');
      confidence += 0.3;
    }

    // Check for automation tools
    const automationPatterns = [
      /selenium/i,
      /phantomjs/i,
      /headlesschrome/i,
      /puppeteer/i,
    ];

    if (automationPatterns.some((pattern) => pattern.test(userAgent))) {
      indicators.push('Automation tool detected');
      confidence += 0.4;
    }

    if (confidence >= 0.3) {
      return {
        type: 'application',
        severity: confidence >= 0.6 ? 'medium' : 'low',
        confidence,
        indicators,
        recommendedAction: confidence >= 0.5 ? 'throttle' : 'monitor',
      };
    }

    return null;
  }

  /**
   * Block an IP address
   */
  private async blockIP(
    ipAddress: string,
    duration: number,
    reason: string,
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const blockKey = `ddos:block:${ipAddress}`;
      const blockData = {
        reason,
        blockedAt: new Date().toISOString(),
        duration,
      };

      await this.redis.setex(
        blockKey,
        Math.ceil(duration / 1000),
        JSON.stringify(blockData),
      );

      this.logger.warn('IP blocked for DDoS protection', {
        ipAddress,
        reason,
        duration,
      });
    } catch (error) {
      this.logger.error('Error blocking IP', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
    }
  }

  /**
   * Apply rate limit reduction for an IP
   */
  private async applyRateLimitReduction(
    ipAddress: string,
    duration: number,
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const reductionKey = `ddos:rate_limit:${ipAddress}`;
      const reductionData = {
        factor: this.mitigationConfig.rateLimitReduction.factor,
        appliedAt: new Date().toISOString(),
        duration,
      };

      await this.redis.setex(
        reductionKey,
        Math.ceil(duration / 1000),
        JSON.stringify(reductionData),
      );

      this.logger.log('Rate limit reduction applied', {
        ipAddress,
        factor: reductionData.factor,
        duration,
      });
    } catch (error) {
      this.logger.error('Error applying rate limit reduction', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
    }
  }
}
