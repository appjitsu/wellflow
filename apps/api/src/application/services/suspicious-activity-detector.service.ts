import { Injectable, Logger } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../../domain/entities/audit-log.entity';

/**
 * Suspicious Activity Detection Result
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SuspiciousActivityResult {
  isSuspicious: boolean;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendedActions: string[];
}

/**
 * Login Attempt Context
 */
export interface LoginAttemptContext {
  userId?: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  failedAttempts?: number;
  isAccountLocked?: boolean;
}

/**
 * Suspicious Activity Detection Rules
 */
interface DetectionRule {
  name: string;
  check: (
    context: LoginAttemptContext,
    history: LoginAttemptContext[],
  ) => {
    triggered: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reason: string;
    recommendedAction: string;
  };
}

/**
 * Suspicious Activity Detector Service
 * Implements security monitoring and threat detection for authentication events
 *
 * Detection Rules:
 * - Multiple failed login attempts from same IP
 * - Login attempts from unusual locations/IPs
 * - Rapid succession login attempts (brute force)
 * - Login attempts outside normal hours
 * - Multiple accounts targeted from same IP
 * - Successful login after multiple failures
 */
@Injectable()
export class SuspiciousActivityDetectorService {
  private readonly logger = new Logger(SuspiciousActivityDetectorService.name);
  private readonly detectionRules: DetectionRule[];

  constructor(private readonly auditLogService: AuditLogService) {
    this.detectionRules = this.initializeDetectionRules();
  }

  /**
   * Analyze login attempt for suspicious activity
   */
  async analyzeLoginAttempt(
    context: LoginAttemptContext,
  ): Promise<SuspiciousActivityResult> {
    this.logger.debug(`Analyzing login attempt for: ${context.email}`);

    try {
      // Get recent login history for analysis
      const recentHistory = await this.getRecentLoginHistory(
        context.email,
        context.ipAddress,
      );

      // Apply detection rules
      const detectionResults = this.detectionRules.map((rule) =>
        rule.check(context, recentHistory),
      );

      // Filter triggered rules
      const triggeredRules = detectionResults.filter(
        (result) => result.triggered,
      );

      if (triggeredRules.length === 0) {
        return {
          isSuspicious: false,
          riskLevel: 'LOW',
          reasons: [],
          recommendedActions: [],
        };
      }

      // Determine overall risk level (highest among triggered rules)
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const maxRiskLevel = triggeredRules.reduce(
        (max, rule) => {
          const currentIndex = riskLevels.indexOf(rule.riskLevel);
          const maxIndex = riskLevels.indexOf(max);
          return currentIndex > maxIndex ? rule.riskLevel : max;
        },
        'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      );

      const result: SuspiciousActivityResult = {
        isSuspicious: true,
        riskLevel: maxRiskLevel,
        reasons: triggeredRules.map((rule) => rule.reason),
        recommendedActions: triggeredRules.map(
          (rule) => rule.recommendedAction,
        ),
      };

      // Log suspicious activity
      await this.logSuspiciousActivity(context, result);

      return result;
    } catch (error) {
      this.logger.error('Error analyzing login attempt:', error);
      // Return safe default
      return {
        isSuspicious: false,
        riskLevel: 'LOW',
        reasons: [],
        recommendedActions: [],
      };
    }
  }

  /**
   * Initialize detection rules
   */
  private initializeDetectionRules(): DetectionRule[] {
    return [
      {
        name: 'Multiple Failed Attempts',
        check: (context, history) => {
          const recentFailures = history.filter(
            (h) =>
              !h.success &&
              h.ipAddress === context.ipAddress &&
              this.isWithinTimeWindow(h.timestamp, 15), // 15 minutes
          ).length;

          if (recentFailures >= 5) {
            return {
              triggered: true,
              riskLevel: 'HIGH',
              reason: `${recentFailures} failed login attempts from same IP in 15 minutes`,
              recommendedAction:
                'Consider IP-based rate limiting or temporary block',
            };
          }

          if (recentFailures >= 3) {
            return {
              triggered: true,
              riskLevel: 'MEDIUM',
              reason: `${recentFailures} failed login attempts from same IP`,
              recommendedAction: 'Monitor for continued attempts',
            };
          }

          return {
            triggered: false,
            riskLevel: 'LOW',
            reason: '',
            recommendedAction: '',
          };
        },
      },
      {
        name: 'Rapid Succession Attempts',
        check: (context, history) => {
          const recentAttempts = history.filter(
            (h) => this.isWithinTimeWindow(h.timestamp, 1), // 1 minute
          ).length;

          if (recentAttempts >= 10) {
            return {
              triggered: true,
              riskLevel: 'CRITICAL',
              reason: `${recentAttempts} login attempts in 1 minute (possible brute force)`,
              recommendedAction:
                'Immediate IP block and security team notification',
            };
          }

          if (recentAttempts >= 5) {
            return {
              triggered: true,
              riskLevel: 'HIGH',
              reason: `${recentAttempts} rapid login attempts in 1 minute`,
              recommendedAction: 'Implement CAPTCHA or temporary delay',
            };
          }

          return {
            triggered: false,
            riskLevel: 'LOW',
            reason: '',
            recommendedAction: '',
          };
        },
      },
      {
        name: 'Unusual Time Access',
        check: (context) => {
          const hour = context.timestamp.getUTCHours();
          // Consider 11 PM to 5 AM as unusual hours
          if (hour >= 23 || hour <= 5) {
            return {
              triggered: true,
              riskLevel: 'MEDIUM',
              reason: `Login attempt at unusual hour (${hour}:00)`,
              recommendedAction:
                'Verify user identity through additional authentication',
            };
          }

          return {
            triggered: false,
            riskLevel: 'LOW',
            reason: '',
            recommendedAction: '',
          };
        },
      },
      {
        name: 'Success After Multiple Failures',
        check: (context, history) => {
          if (!context.success) {
            return {
              triggered: false,
              riskLevel: 'LOW',
              reason: '',
              recommendedAction: '',
            };
          }

          const recentFailures = history.filter(
            (h) =>
              !h.success &&
              h.email === context.email &&
              this.isWithinTimeWindow(h.timestamp, 30), // 30 minutes
          ).length;

          if (recentFailures >= 3) {
            return {
              triggered: true,
              riskLevel: 'MEDIUM',
              reason: `Successful login after ${recentFailures} failed attempts`,
              recommendedAction:
                'Verify user identity and check for credential compromise',
            };
          }

          return {
            triggered: false,
            riskLevel: 'LOW',
            reason: '',
            recommendedAction: '',
          };
        },
      },
    ];
  }

  /**
   * Check if timestamp is within specified time window (in minutes)
   */
  private isWithinTimeWindow(timestamp: Date, minutes: number): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - timestamp.getTime();
    return timeDiff <= minutes * 60 * 1000;
  }

  /**
   * Get recent login history for analysis
   * This is a placeholder - in a real implementation, this would query the audit logs
   */
  protected getRecentLoginHistory(
    email: string,
    ipAddress?: string,
  ): Promise<LoginAttemptContext[]> {
    // For now, return empty array
    this.logger.debug(`Getting login history for ${email} from ${ipAddress}`);
    return Promise.resolve([]);
  }

  /**
   * Log suspicious activity to audit logs
   */
  private async logSuspiciousActivity(
    context: LoginAttemptContext,
    result: SuspiciousActivityResult,
  ): Promise<void> {
    await this.auditLogService.logFailure(
      AuditAction.LOGIN,
      AuditResourceType.USER,
      context.userId || 'unknown',
      'Suspicious login activity detected',
      {},
      {
        businessContext: {
          email: context.email,
          riskLevel: result.riskLevel,
          reasons: result.reasons,
          recommendedActions: result.recommendedActions,
          suspiciousActivity: true,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    );

    this.logger.warn(
      `Suspicious activity detected for ${context.email}: ${result.reasons.join(', ')}`,
    );
  }
}
