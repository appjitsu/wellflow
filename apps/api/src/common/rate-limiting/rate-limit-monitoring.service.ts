import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';

// Constants
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';
import {
  DDoSProtectionService,
  DDoSDetectionResult,
} from './ddos-protection.service';
import { IPReputationService } from './ip-reputation.service';
import { BypassTokenService } from './bypass-token.service';

export interface RateLimitAlert {
  type:
    | 'ddos_attack'
    | 'high_risk_ip'
    | 'bypass_token_abuse'
    | 'rate_limit_threshold';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
}

export interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  ddosAttacks: number;
  highRiskIPs: number;
  bypassTokenUsage: number;
  averageResponseTime: number;
  timestamp: Date;
}

/**
 * Rate Limit Monitoring Service
 *
 * Provides comprehensive monitoring and alerting for rate limiting,
 * DDoS protection, and IP reputation systems.
 */
@Injectable()
export class RateLimitMonitoringService {
  private readonly logger = new Logger(RateLimitMonitoringService.name);

  // Alert thresholds
  private readonly alertThresholds = {
    ddosAttackScore: 70,
    highRiskIPScore: 80,
    bypassTokenUsagePerHour: 50,
    blockedRequestsPerMinute: 100,
    errorRateThreshold: 0.1, // 10%
  };

  // Metrics collection intervals
  private readonly metricsBuffer: RateLimitMetrics[] = [];
  private readonly maxBufferSize = 1000;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly ddosProtectionService: DDoSProtectionService,
    private readonly ipReputationService: IPReputationService,
    private readonly bypassTokenService: BypassTokenService,
  ) {}

  /**
   * Record a rate limiting event
   */
  async recordRateLimitEvent(
    type: 'request' | 'blocked' | 'bypass_used' | 'ddos_detected',
    ipAddress: string,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      // Record metrics for monitoring
      this.logger.debug(`Rate limit event: ${type}`, {
        ip_address: ipAddress,
      });

      // Check for alert conditions
      await this.checkAlertConditions(type, ipAddress, details);

      // Emit event for other services
      this.eventEmitter.emit('rate-limit.event', {
        type,
        ipAddress,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error recording rate limit event', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        type,
        ipAddress,
      });
    }
  }

  /**
   * Record DDoS detection result
   */
  recordDDoSDetection(result: DDoSDetectionResult): void {
    try {
      if (result.isAttack) {
        // Record DDoS attack metrics
        this.logger.warn('DDoS attack detected', {
          ip_address: result.ipAddress,
          risk_score: result.riskScore.toString(),
        });

        // Check if alert should be sent
        if (result.riskScore >= this.alertThresholds.ddosAttackScore) {
          this.sendAlert({
            type: 'ddos_attack',
            severity: result.riskScore >= 90 ? 'critical' : 'high',
            message: `DDoS attack detected from ${result.ipAddress}`,
            details: {
              riskScore: result.riskScore,
              patterns: result.patterns.map((p) => p.type),
              indicators: result.patterns.flatMap((p) => p.indicators),
            },
            timestamp: result.timestamp,
            ipAddress: result.ipAddress,
          });
        }

        this.logger.warn('DDoS attack detected', {
          ipAddress: result.ipAddress,
          riskScore: result.riskScore,
          patterns: result.patterns.map((p) => p.type),
        });
      }
    } catch (error) {
      this.logger.error('Error recording DDoS detection', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress: result.ipAddress,
      });
    }
  }

  /**
   * Record bypass token usage
   */
  async recordBypassTokenUsage(
    ipAddress: string,
    tokenHash: string,
    reason: string,
  ): Promise<void> {
    try {
      // Record bypass token usage
      this.logger.debug('Bypass token usage recorded', {
        ip_address: ipAddress,
      });

      // Check for abuse patterns
      await this.checkBypassTokenAbuse(ipAddress);

      this.logger.log('Bypass token used', {
        ipAddress,
        tokenHash: tokenHash.substring(0, 8) + '...',
        reason,
      });
    } catch (error) {
      this.logger.error('Error recording bypass token usage', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
    }
  }

  /**
   * Get current rate limiting statistics
   */
  async getRateLimitStats(): Promise<{
    requests: { total: number; blocked: number; allowed: number };
    ddos: { attacks: number; blockedIPs: number; mitigationActions: number };
    reputation: {
      totalIPs: number;
      highRisk: number;
      whitelisted: number;
      blacklisted: number;
    };
    bypass: { activeTokens: number; totalUsage: number };
  }> {
    try {
      const [ddosStats, reputationStats, bypassStats] = await Promise.all([
        this.ddosProtectionService.getDDoSStats(),
        this.ipReputationService.getIPStats(),
        this.bypassTokenService.getTokenStats(),
      ]);

      // Get request stats from metrics (simplified - in real implementation,
      // you'd query your metrics store)
      const requestStats = {
        total: 0, // Would be fetched from metrics
        blocked: 0,
        allowed: 0,
      };

      return {
        requests: requestStats,
        ddos: {
          attacks: ddosStats.activeAttacks,
          blockedIPs: ddosStats.blockedIPs,
          mitigationActions: ddosStats.mitigationActions,
        },
        reputation: {
          totalIPs: reputationStats.totalTrackedIPs,
          highRisk: reputationStats.highRiskIPs,
          whitelisted: reputationStats.whitelistedIPs,
          blacklisted: reputationStats.blacklistedIPs,
        },
        bypass: {
          activeTokens: bypassStats.activeTokens,
          totalUsage: bypassStats.totalUsage,
        },
      };
    } catch (error) {
      this.logger.error('Error getting rate limit stats', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });

      // Return safe defaults
      return {
        requests: { total: 0, blocked: 0, allowed: 0 },
        ddos: { attacks: 0, blockedIPs: 0, mitigationActions: 0 },
        reputation: {
          totalIPs: 0,
          highRisk: 0,
          whitelisted: 0,
          blacklisted: 0,
        },
        bypass: { activeTokens: 0, totalUsage: 0 },
      };
    }
  }

  /**
   * Collect metrics every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics(): Promise<void> {
    try {
      const stats = await this.getRateLimitStats();

      const metrics: RateLimitMetrics = {
        totalRequests: stats.requests.total,
        blockedRequests: stats.requests.blocked,
        ddosAttacks: stats.ddos.attacks,
        highRiskIPs: stats.reputation.highRisk,
        bypassTokenUsage: stats.bypass.totalUsage,
        averageResponseTime: 0, // Would be calculated from actual metrics
        timestamp: new Date(),
      };

      // Add to buffer
      this.metricsBuffer.push(metrics);
      if (this.metricsBuffer.length > this.maxBufferSize) {
        this.metricsBuffer.shift();
      }

      // Record metrics for monitoring
      this.logger.debug('Rate limit metrics collected', {
        totalRequests: metrics.totalRequests,
        blockedRequests: metrics.blockedRequests,
        ddosAttacks: metrics.ddosAttacks,
        highRiskIPs: metrics.highRiskIPs,
        bypassTokenUsage: metrics.bypassTokenUsage,
      });
    } catch (error) {
      this.logger.error('Error collecting metrics', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
    }
  }

  /**
   * Check for system health issues every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performHealthCheck(): Promise<void> {
    try {
      const stats = await this.getRateLimitStats();

      // Check for high blocked request rate
      if (
        stats.requests.blocked >
        this.alertThresholds.blockedRequestsPerMinute * 5
      ) {
        this.sendAlert({
          type: 'rate_limit_threshold',
          severity: 'high',
          message: 'High rate of blocked requests detected',
          details: {
            blockedRequests: stats.requests.blocked,
            threshold: this.alertThresholds.blockedRequestsPerMinute * 5,
          },
          timestamp: new Date(),
        });
      }

      // Check for high number of DDoS attacks
      if (stats.ddos.attacks > 10) {
        this.sendAlert({
          type: 'ddos_attack',
          severity: 'critical',
          message: 'Multiple DDoS attacks detected',
          details: {
            attackCount: stats.ddos.attacks,
            blockedIPs: stats.ddos.blockedIPs,
          },
          timestamp: new Date(),
        });
      }

      // Check for high bypass token usage
      if (
        stats.bypass.totalUsage > this.alertThresholds.bypassTokenUsagePerHour
      ) {
        this.sendAlert({
          type: 'bypass_token_abuse',
          severity: 'medium',
          message: 'High bypass token usage detected',
          details: {
            totalUsage: stats.bypass.totalUsage,
            threshold: this.alertThresholds.bypassTokenUsagePerHour,
          },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error('Error performing health check', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
    }
  }

  /**
   * Get recent metrics for dashboard
   */
  getRecentMetrics(minutes: number = 60): RateLimitMetrics[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricsBuffer.filter((m) => m.timestamp >= cutoff);
  }

  /**
   * Check alert conditions for rate limit events
   */
  private async checkAlertConditions(
    type: string,
    ipAddress: string,
    _details: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Check IP reputation for high-risk IPs
      if (type === 'request' || type === 'blocked') {
        const reputation =
          await this.ipReputationService.getIPReputation(ipAddress);

        if (
          reputation.riskLevel === 'critical' ||
          reputation.score >= this.alertThresholds.highRiskIPScore
        ) {
          this.sendAlert({
            type: 'high_risk_ip',
            severity: reputation.riskLevel === 'critical' ? 'critical' : 'high',
            message: `High-risk IP detected: ${ipAddress}`,
            details: {
              riskScore: reputation.score,
              riskLevel: reputation.riskLevel,
              factors: reputation.factors.map((f) => f.type),
            },
            timestamp: new Date(),
            ipAddress,
          });
        }
      }
    } catch (error) {
      this.logger.error('Error checking alert conditions', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        type,
        ipAddress,
      });
    }
  }

  /**
   * Check for bypass token abuse patterns
   */
  private async checkBypassTokenAbuse(_ipAddress: string): Promise<void> {
    // This would implement logic to detect abuse patterns
    // For now, it's a placeholder
    // Example: Check if same IP is using multiple bypass tokens
    // Example: Check if bypass tokens are being used too frequently
    // Example: Check if bypass tokens are being used from suspicious IPs
  }

  /**
   * Send alert to monitoring systems
   */
  private sendAlert(alert: RateLimitAlert): void {
    try {
      // Emit event for alert handlers
      this.eventEmitter.emit('rate-limit.alert', alert);

      // Log the alert
      this.logger.warn('Rate limiting alert', {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        ipAddress: alert.ipAddress,
      });

      // Record alert metric
      this.logger.debug('Rate limit alert sent', {
        type: alert.type,
        severity: alert.severity,
      });
    } catch (error) {
      this.logger.error('Error sending alert', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        alert: alert.type,
      });
    }
  }
}
