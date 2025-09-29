import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  ExternalThreatIntelligenceService,
  ExternalReputationFactor,
} from './external-threat-intelligence';

// Constants
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IPReputationScore {
  ipAddress: string;
  score: number; // 0-100 (0 = excellent, 100 = malicious)
  riskLevel: RiskLevel;
  factors: IPReputationFactor[];
  lastUpdated: Date;
  firstSeen: Date;
}

export interface IPReputationFactor {
  type:
    | 'abuse_reports'
    | 'failed_auth'
    | 'rate_limit_violations'
    | 'geographic'
    | 'behavioral'
    | 'whitelist'
    | 'blacklist'
    | 'abuseipdb'
    | 'threat-feed'
    | 'external';
  impact: number; // -50 to +50 (negative = good, positive = bad)
  description: string;
  timestamp: Date;
}

export interface IPBehaviorPattern {
  requestCount: number;
  errorRate: number;
  avgResponseTime: number;
  uniqueEndpoints: number;
  userAgents: string[];
  timePattern: 'normal' | 'burst' | 'constant' | 'suspicious';
}

export interface GeographicInfo {
  country: string;
  region?: string;
  city?: string;
  isHighRisk: boolean;
  vpnDetected: boolean;
  torDetected: boolean;
}

interface WhitelistData {
  reason: string;
  addedBy: string;
  addedAt: string;
}

interface BlacklistData {
  reason: string;
  addedBy: string;
  addedAt: string;
}

interface CachedReputationData {
  ipAddress: string;
  score: number;
  riskLevel: string;
  factors: CachedReputationFactor[];
  lastUpdated: string;
  firstSeen: string;
}

interface CachedReputationFactor {
  type: string;
  impact: number;
  description: string;
  timestamp: string;
}

interface ActivityData {
  type: string;
  endpoint?: string;
  userAgent?: string;
  statusCode?: number;
  responseTime?: number;
  timestamp: string;
}

/**
 * IP Reputation Service
 *
 * Tracks and scores IP addresses based on behavior patterns,
 * geographic location, and historical activity for enhanced security.
 */
@Injectable()
export class IPReputationService {
  private readonly logger = new Logger(IPReputationService.name);

  // Reputation scoring weights
  private readonly scoringWeights = {
    abuseReports: 30,
    failedAuth: 25,
    rateLimitViolations: 20,
    geographic: 15,
    behavioral: 10,
  };

  // High-risk countries and regions
  private readonly highRiskCountries = new Set([
    'CN',
    'RU',
    'KP',
    'IR',
    'SY',
    'AF',
    'IQ',
    'LY',
    'SO',
    'SD',
  ]);

  // Known good IP ranges (can be configured)
  private readonly whitelistedRanges: string[] = [
    // Add trusted IP ranges here
    // '192.168.0.0/16', // Private networks
    // '10.0.0.0/8',
  ];

  // Known bad IP ranges
  private readonly blacklistedRanges: string[] = [
    // Add known malicious IP ranges here
  ];

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis | null,
    private readonly externalThreatIntelligence: ExternalThreatIntelligenceService,
  ) {}

  /**
   * Get IP reputation score
   */
  async getIPReputation(ipAddress: string): Promise<IPReputationScore> {
    try {
      // Try to get cached reputation
      const cached = await this.getCachedReputation(ipAddress);
      if (cached && this.isReputationFresh(cached)) {
        return cached;
      }

      // Calculate new reputation score
      const reputation = await this.calculateReputation(ipAddress);

      // Cache the result
      if (this.redis) {
        await this.cacheReputation(reputation);
      }

      return reputation;
    } catch (error) {
      this.logger.error('Error getting IP reputation', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });

      // Return safe default
      return this.createDefaultReputation(ipAddress);
    }
  }

  /**
   * Update IP reputation based on activity
   */
  async updateIPReputation(
    ipAddress: string,
    activity: {
      type:
        | 'request'
        | 'auth_failure'
        | 'rate_limit_violation'
        | 'abuse_report';
      endpoint?: string;
      userAgent?: string;
      statusCode?: number;
      responseTime?: number;
    },
  ): Promise<void> {
    try {
      if (!this.redis) return;

      const now = new Date();
      const activityKey = `ip:activity:${ipAddress}`;

      // Record the activity
      const activityData = {
        ...activity,
        timestamp: now.toISOString(),
      };

      await this.redis.zadd(
        activityKey,
        now.getTime(),
        JSON.stringify(activityData),
      );

      // Keep only last 24 hours of activity
      const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
      await this.redis.zremrangebyscore(activityKey, '-inf', oneDayAgo);

      // Set expiration for cleanup
      await this.redis.expire(activityKey, 24 * 60 * 60); // 24 hours

      // Invalidate cached reputation to force recalculation
      await this.invalidateCachedReputation(ipAddress);
    } catch (error) {
      this.logger.error('Error updating IP reputation', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
        activity: activity.type,
      });
    }
  }

  /**
   * Check if IP should be blocked based on reputation
   */
  async shouldBlockIP(ipAddress: string): Promise<{
    shouldBlock: boolean;
    reason?: string;
    reputation: IPReputationScore;
  }> {
    const reputation = await this.getIPReputation(ipAddress);

    // Debug logging for threat detection
    this.logger.debug('IP reputation analysis', {
      ipAddress,
      score: reputation.score,
      riskLevel: reputation.riskLevel,
      factors: reputation.factors.map((f) => ({
        type: f.type,
        impact: f.impact,
        description: f.description,
      })),
    });

    // Block if reputation score is critical
    if (reputation.riskLevel === 'critical') {
      this.logger.warn('Blocking IP due to critical reputation', {
        ipAddress,
        score: reputation.score,
        riskLevel: reputation.riskLevel,
      });
      return {
        shouldBlock: true,
        reason: `Critical reputation score: ${reputation.score}`,
        reputation,
      };
    }

    // Block if multiple high-impact factors
    const highImpactFactors = reputation.factors.filter((f) => f.impact >= 20);
    if (highImpactFactors.length >= 3) {
      this.logger.warn('Blocking IP due to multiple high-impact factors', {
        ipAddress,
        highImpactFactors: highImpactFactors.map((f) => f.type),
        factorCount: highImpactFactors.length,
      });
      return {
        shouldBlock: true,
        reason: `Multiple high-impact factors: ${highImpactFactors.map((f) => f.type).join(', ')}`,
        reputation,
      };
    }

    this.logger.debug('IP not blocked', {
      ipAddress,
      score: reputation.score,
      riskLevel: reputation.riskLevel,
      highImpactFactorCount: highImpactFactors.length,
    });

    return {
      shouldBlock: false,
      reputation,
    };
  }

  /**
   * Get rate limit multiplier based on IP reputation
   */
  getRateLimitMultiplier(reputation: IPReputationScore): number {
    switch (reputation.riskLevel) {
      case 'critical':
        return 0.1; // 10% of normal rate limit
      case 'high':
        return 0.3; // 30% of normal rate limit
      case 'medium':
        return 0.7; // 70% of normal rate limit
      case 'low':
      default:
        return 1.0; // Normal rate limit
    }
  }

  /**
   * Add IP to whitelist
   */
  async whitelistIP(
    ipAddress: string,
    reason: string,
    addedBy: string,
  ): Promise<void> {
    try {
      if (!this.redis) return;

      const whitelistKey = `ip:whitelist:${ipAddress}`;
      const whitelistData = {
        reason,
        addedBy,
        addedAt: new Date().toISOString(),
      };

      await this.redis.set(whitelistKey, JSON.stringify(whitelistData));

      // Invalidate cached reputation
      await this.invalidateCachedReputation(ipAddress);

      this.logger.log('IP whitelisted', {
        ipAddress,
        reason,
        addedBy,
      });
    } catch (error) {
      this.logger.error('Error whitelisting IP', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
    }
  }

  /**
   * Add IP to blacklist
   */
  async blacklistIP(
    ipAddress: string,
    reason: string,
    addedBy: string,
  ): Promise<void> {
    try {
      if (!this.redis) return;

      const blacklistKey = `ip:blacklist:${ipAddress}`;
      const blacklistData = {
        reason,
        addedBy,
        addedAt: new Date().toISOString(),
      };

      await this.redis.set(blacklistKey, JSON.stringify(blacklistData));

      // Invalidate cached reputation
      await this.invalidateCachedReputation(ipAddress);

      this.logger.warn('IP blacklisted', {
        ipAddress,
        reason,
        addedBy,
      });
    } catch (error) {
      this.logger.error('Error blacklisting IP', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
    }
  }

  /**
   * Get IP statistics
   */
  async getIPStats(): Promise<{
    totalTrackedIPs: number;
    whitelistedIPs: number;
    blacklistedIPs: number;
    highRiskIPs: number;
  }> {
    if (!this.redis) {
      return {
        totalTrackedIPs: 0,
        whitelistedIPs: 0,
        blacklistedIPs: 0,
        highRiskIPs: 0,
      };
    }

    try {
      const [whitelistKeys, blacklistKeys, reputationKeys] = await Promise.all([
        this.redis.keys('ip:whitelist:*'),
        this.redis.keys('ip:blacklist:*'),
        this.redis.keys('ip:reputation:*'),
      ]);

      // Count high-risk IPs
      let highRiskIPs = 0;
      for (const key of reputationKeys) {
        const reputationData = await this.redis.get(key);
        if (reputationData) {
          const reputation = JSON.parse(reputationData) as IPReputationScore;
          if (
            reputation.riskLevel === 'high' ||
            reputation.riskLevel === 'critical'
          ) {
            highRiskIPs++;
          }
        }
      }

      return {
        totalTrackedIPs: reputationKeys.length,
        whitelistedIPs: whitelistKeys.length,
        blacklistedIPs: blacklistKeys.length,
        highRiskIPs,
      };
    } catch (error) {
      this.logger.error('Error getting IP stats', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
      return {
        totalTrackedIPs: 0,
        whitelistedIPs: 0,
        blacklistedIPs: 0,
        highRiskIPs: 0,
      };
    }
  }

  /**
   * Calculate reputation score for an IP
   */
  private async calculateReputation(
    ipAddress: string,
  ): Promise<IPReputationScore> {
    const factors: IPReputationFactor[] = [];
    const now = new Date();

    // Get external threat intelligence (high priority)
    const externalFactors = await this.getExternalThreatFactors(ipAddress);
    factors.push(...externalFactors);

    // Check local whitelist/blacklist
    const whitelistFactor = await this.checkWhitelist(ipAddress);
    if (whitelistFactor) factors.push(whitelistFactor);

    const blacklistFactor = await this.checkBlacklist(ipAddress);
    if (blacklistFactor) factors.push(blacklistFactor);

    // Analyze local behavior patterns
    const behaviorFactors = await this.analyzeBehaviorPatterns(ipAddress);
    factors.push(...behaviorFactors);

    // Calculate final score
    let score = 50; // Start with neutral score
    for (const factor of factors) {
      score += factor.impact;
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) riskLevel = 'critical';
    else if (score >= 60) riskLevel = 'high';
    else if (score >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      ipAddress,
      score,
      riskLevel,
      factors,
      lastUpdated: now,
      firstSeen: (await this.getFirstSeenDate(ipAddress)) || now,
    };
  }

  /**
   * Get external threat intelligence factors
   */
  private async getExternalThreatFactors(
    ipAddress: string,
  ): Promise<IPReputationFactor[]> {
    try {
      if (!this.externalThreatIntelligence.hasAvailableServices()) {
        this.logger.debug('No external threat intelligence services available');
        return [];
      }

      const externalData =
        await this.externalThreatIntelligence.analyzeIP(ipAddress);
      const externalFactors =
        this.externalThreatIntelligence.convertToReputationFactors(
          externalData,
        );

      // Convert external factors to local format
      return externalFactors.map(
        (factor: ExternalReputationFactor): IPReputationFactor => ({
          type: this.mapExternalTypeToLocal(factor.type),
          impact: factor.impact,
          description: `${factor.source}: ${factor.description}`,
          timestamp: new Date(),
        }),
      );
    } catch (error) {
      this.logger.error('Error getting external threat factors', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return [];
    }
  }

  /**
   * Map external threat intelligence types to local types
   */
  private mapExternalTypeToLocal(
    externalType: string,
  ): IPReputationFactor['type'] {
    switch (externalType) {
      case 'abuseipdb':
        return 'abuseipdb';
      case 'geographic':
        return 'geographic';
      case 'threat-feed':
        return 'threat-feed';
      default:
        return 'external';
    }
  }

  /**
   * Check if IP is whitelisted
   */
  private async checkWhitelist(
    ipAddress: string,
  ): Promise<IPReputationFactor | null> {
    if (!this.redis) return null;

    try {
      const whitelistKey = `ip:whitelist:${ipAddress}`;
      const whitelistData = await this.redis.get(whitelistKey);

      if (whitelistData) {
        const data = JSON.parse(whitelistData) as WhitelistData;
        return {
          type: 'whitelist' as const,
          impact: -30, // Strong positive impact
          description: `Whitelisted: ${data.reason}`,
          timestamp: new Date(data.addedAt),
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error checking whitelist', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return null;
    }
  }

  /**
   * Check if IP is blacklisted
   */
  private async checkBlacklist(
    ipAddress: string,
  ): Promise<IPReputationFactor | null> {
    if (!this.redis) return null;

    try {
      const blacklistKey = `ip:blacklist:${ipAddress}`;
      const blacklistData = await this.redis.get(blacklistKey);

      if (blacklistData) {
        const data = JSON.parse(blacklistData) as BlacklistData;
        return {
          type: 'blacklist' as const,
          impact: 40, // Strong negative impact
          description: `Blacklisted: ${data.reason}`,
          timestamp: new Date(data.addedAt),
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error checking blacklist', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return null;
    }
  }

  /**
   * Analyze behavior patterns
   */
  private async analyzeBehaviorPatterns(
    ipAddress: string,
  ): Promise<IPReputationFactor[]> {
    if (!this.redis) return [];

    try {
      const factors: IPReputationFactor[] = [];
      const activityKey = `ip:activity:${ipAddress}`;
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Get recent activity
      const activities = await this.redis.zrangebyscore(
        activityKey,
        oneHourAgo,
        now,
      );

      if (!activities || activities.length === 0) return factors;

      // Count different types of activities
      let authFailures = 0;
      let rateLimitViolations = 0;
      let _totalRequests = 0;

      for (const activityStr of activities) {
        const activity = JSON.parse(activityStr) as ActivityData;
        _totalRequests++;

        switch (activity.type) {
          case 'auth_failure':
            authFailures++;
            break;
          case 'rate_limit_violation':
            rateLimitViolations++;
            break;
        }
      }

      // Add factors based on behavior
      if (authFailures > 5) {
        factors.push({
          type: 'failed_auth',
          impact: Math.min(25, authFailures * 2),
          description: `${authFailures} authentication failures in last hour`,
          timestamp: new Date(),
        });
      }

      if (rateLimitViolations > 3) {
        factors.push({
          type: 'rate_limit_violations',
          impact: Math.min(20, rateLimitViolations * 3),
          description: `${rateLimitViolations} rate limit violations in last hour`,
          timestamp: new Date(),
        });
      }

      return factors;
    } catch (error) {
      this.logger.error('Error analyzing behavior patterns', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return [];
    }
  }

  /**
   * Check geographic factors
   */
  private checkGeographicFactors(
    _ipAddress: string,
  ): IPReputationFactor | null {
    // This is a simplified implementation
    // In a real system, you would integrate with a GeoIP service

    // For now, we'll do basic checks based on IP ranges
    // This could be enhanced with actual GeoIP lookup

    return null; // Placeholder - implement GeoIP lookup if needed
  }

  /**
   * Get cached reputation
   */
  private async getCachedReputation(
    ipAddress: string,
  ): Promise<IPReputationScore | null> {
    if (!this.redis) return null;

    try {
      const reputationKey = `ip:reputation:${ipAddress}`;
      const cached = await this.redis.get(reputationKey);

      if (cached) {
        const reputation = JSON.parse(cached) as CachedReputationData;
        return {
          ...reputation,
          riskLevel: reputation.riskLevel as
            | 'low'
            | 'medium'
            | 'high'
            | 'critical',
          lastUpdated: new Date(reputation.lastUpdated),
          firstSeen: new Date(reputation.firstSeen),
          factors: (reputation.factors || []).map(
            (f: CachedReputationFactor) => ({
              ...f,
              type: f.type as IPReputationFactor['type'],
              timestamp: new Date(f.timestamp),
            }),
          ),
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Error getting cached reputation', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return null;
    }
  }

  /**
   * Cache reputation score
   */
  private async cacheReputation(reputation: IPReputationScore): Promise<void> {
    if (!this.redis) return;

    try {
      const reputationKey = `ip:reputation:${reputation.ipAddress}`;
      const ttl = 60 * 60; // 1 hour cache

      await this.redis.setex(reputationKey, ttl, JSON.stringify(reputation));
    } catch (error) {
      this.logger.error('Error caching reputation', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress: reputation.ipAddress,
      });
    }
  }

  /**
   * Check if reputation is fresh (less than 1 hour old)
   */
  private isReputationFresh(reputation: IPReputationScore): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return reputation.lastUpdated > oneHourAgo;
  }

  /**
   * Invalidate cached reputation
   */
  private async invalidateCachedReputation(ipAddress: string): Promise<void> {
    if (!this.redis) return;

    try {
      const reputationKey = `ip:reputation:${ipAddress}`;
      await this.redis.del(reputationKey);
    } catch (error) {
      this.logger.error('Error invalidating cached reputation', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
    }
  }

  /**
   * Get first seen date for IP
   */
  private async getFirstSeenDate(ipAddress: string): Promise<Date | null> {
    if (!this.redis) return null;

    try {
      const firstSeenKey = `ip:first_seen:${ipAddress}`;
      const firstSeen = await this.redis.get(firstSeenKey);

      if (!firstSeen) {
        // Set first seen to now
        const now = new Date();
        await this.redis.set(firstSeenKey, now.toISOString());
        return now;
      }

      return new Date(firstSeen);
    } catch (error) {
      this.logger.error('Error getting first seen date', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return null;
    }
  }

  /**
   * Create default reputation for unknown IPs
   */
  private createDefaultReputation(ipAddress: string): IPReputationScore {
    const now = new Date();
    return {
      ipAddress,
      score: 50, // Neutral score
      riskLevel: 'medium',
      factors: [],
      lastUpdated: now,
      firstSeen: now,
    };
  }
}
