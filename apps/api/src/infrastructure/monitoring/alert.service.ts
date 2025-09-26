import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Alert {
  id: string;
  type: 'PERFORMANCE' | 'ERROR' | 'SECURITY' | 'BUSINESS' | 'SYSTEM';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: Record<string, unknown>) => boolean;
  alertTemplate: Omit<Alert, 'id' | 'timestamp' | 'resolved' | 'resolvedAt'>;
  cooldownMinutes: number;
  enabled: boolean;
}

export interface NotificationChannel {
  id: string;
  type: 'EMAIL' | 'WEBHOOK' | 'SLACK' | 'SMS';
  name: string;
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface NotificationResult {
  success: boolean;
  channelId: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Alert Service
 * Comprehensive alerting system for the WellFlow API
 * Handles alert creation, rule evaluation, and multi-channel notifications
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private readonly alerts = new Map<string, Alert>();
  private readonly alertRules = new Map<string, AlertRule>();
  private readonly notificationChannels = new Map<
    string,
    NotificationChannel
  >();
  private readonly alertCooldowns = new Map<string, Date>();

  constructor(private readonly configService: ConfigService) {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }

  /**
   * Create and process a new alert
   */
  async createAlert(
    alertData: Omit<Alert, 'id' | 'timestamp'>,
  ): Promise<Alert> {
    const alert: Alert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
    };

    // Check if alert should be suppressed due to cooldown
    if (this.isAlertOnCooldown(alert)) {
      this.logger.debug(`Alert suppressed due to cooldown: ${alert.title}`);
      return alert;
    }

    // Store alert
    this.alerts.set(alert.id, alert);
    this.logger.log(`Alert created: ${alert.title} (${alert.severity})`);

    // Send notifications
    await this.sendNotifications(alert);

    // Set cooldown
    this.setAlertCooldown(alert);

    return alert;
  }

  /**
   * Evaluate metrics against alert rules
   */
  async evaluateRules(metrics: Record<string, unknown>): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(metrics)) {
          const alertData = {
            ...rule.alertTemplate,
            metadata: { ...rule.alertTemplate.metadata, metrics },
          };

          await this.createAlert(alertData);
        }
      } catch (error) {
        this.logger.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.logger.log(`Alert resolved: ${alert.title}`);

    // Send resolution notification
    await this.sendResolutionNotification(alert);

    return true;
  }

  /**
   * Add a new alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.log(`Alert rule added: ${rule.name}`);
  }

  /**
   * Add a notification channel
   */
  addNotificationChannel(channel: NotificationChannel): void {
    this.notificationChannels.set(channel.id, channel);
    this.logger.log(
      `Notification channel added: ${channel.name} (${channel.type})`,
    );
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => !alert.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    const channels = Array.from(this.notificationChannels.values()).filter(
      (channel) => channel.enabled,
    );

    const results: NotificationResult[] = [];

    for (const channel of channels) {
      try {
        const result = await this.sendToChannel(alert, channel);
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to send alert to channel ${channel.id}:`,
          error,
        );
        results.push({
          success: false,
          channelId: channel.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Log notification results
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    this.logger.log(
      `Alert notifications sent: ${successful} successful, ${failed} failed`,
    );
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(
    alert: Alert,
    channel: NotificationChannel,
  ): Promise<NotificationResult> {
    switch (channel.type) {
      case 'EMAIL':
        return this.sendEmailAlert(alert, channel);
      case 'WEBHOOK':
        return this.sendWebhookAlert(alert, channel);
      case 'SLACK':
        return this.sendSlackAlert(alert, channel);
      case 'SMS':
        return this.sendSMSAlert(alert, channel);
      default:
        throw new Error(`Unsupported channel type: ${String(channel.type)}`);
    }
  }

  /**
   * Send email alert
   */
  private sendEmailAlert(
    alert: Alert,
    channel: NotificationChannel,
  ): NotificationResult {
    // For now, log the intent
    this.logger.log(`📧 Would send email alert: ${alert.title}`, {
      channel: channel.name,
      recipients: channel.config.recipients,
      severity: alert.severity,
    });

    return {
      success: true,
      channelId: channel.id,
      metadata: { simulated: true },
    };
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(
    alert: Alert,
    channel: NotificationChannel,
  ): Promise<NotificationResult> {
    const webhookUrl = channel.config.url as string;

    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        metadata: alert.metadata,
      },
      channel: channel.name,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WellFlow-Alert-Service/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook returned ${response.status}: ${response.statusText}`,
        );
      }

      return {
        success: true,
        channelId: channel.id,
        metadata: { statusCode: response.status },
      };
    } catch (error) {
      throw new Error(
        `Webhook request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(
    alert: Alert,
    channel: NotificationChannel,
  ): Promise<NotificationResult> {
    const webhookUrl = channel.config.webhookUrl as string;

    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const color = this.getSeverityColor(alert.severity);
    const payload = {
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity,
              short: true,
            },
            {
              title: 'Type',
              value: alert.type,
              short: true,
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: false,
            },
          ],
          footer: 'WellFlow Alert Service',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Slack webhook returned ${response.status}: ${response.statusText}`,
        );
      }

      return {
        success: true,
        channelId: channel.id,
        metadata: { statusCode: response.status },
      };
    } catch (error) {
      throw new Error(
        `Slack webhook request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Send SMS alert
   */
  private sendSMSAlert(
    alert: Alert,
    channel: NotificationChannel,
  ): NotificationResult {
    // For now, log the intent
    this.logger.log(`📱 Would send SMS alert: ${alert.title}`, {
      channel: channel.name,
      recipients: channel.config.phoneNumbers,
      severity: alert.severity,
    });

    return {
      success: true,
      channelId: channel.id,
      metadata: { simulated: true },
    };
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert): Promise<void> {
    // Send resolution notifications to channels that support it
    const channels = Array.from(this.notificationChannels.values()).filter(
      (channel) => channel.enabled && channel.config.notifyOnResolution,
    );

    for (const channel of channels) {
      try {
        const resolutionAlert = {
          ...alert,
          title: `✅ RESOLVED: ${alert.title}`,
          message: `Alert has been resolved.\n\nOriginal issue: ${alert.message}`,
        };

        await this.sendToChannel(resolutionAlert, channel);
      } catch (error) {
        this.logger.error(
          `Failed to send resolution notification to channel ${channel.id}:`,
          error,
        );
      }
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    // Performance alert rules
    this.addAlertRule({
      id: 'slow-query-critical',
      name: 'Critical Slow Query',
      condition: (metrics) => (metrics.executionTime as number) > 5000,
      alertTemplate: {
        type: 'PERFORMANCE',
        severity: 'CRITICAL',
        title: 'Critical Slow Query Detected',
        message: 'A database query exceeded 5 seconds execution time',
        metadata: { rule: 'slow-query-critical' },
      },
      cooldownMinutes: 10,
      enabled: true,
    });

    this.addAlertRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: (metrics) => (metrics.errorRate as number) > 0.05, // 5% error rate
      alertTemplate: {
        type: 'ERROR',
        severity: 'HIGH',
        title: 'High Error Rate Detected',
        message: 'API error rate has exceeded 5%',
        metadata: { rule: 'high-error-rate' },
      },
      cooldownMinutes: 15,
      enabled: true,
    });

    this.addAlertRule({
      id: 'circuit-breaker-open',
      name: 'Circuit Breaker Open',
      condition: (metrics) =>
        (metrics.circuitBreakerState as string) === 'OPEN',
      alertTemplate: {
        type: 'SYSTEM',
        severity: 'HIGH',
        title: 'Circuit Breaker Opened',
        message: 'A circuit breaker has opened due to repeated failures',
        metadata: { rule: 'circuit-breaker-open' },
      },
      cooldownMinutes: 5,
      enabled: true,
    });

    this.addAlertRule({
      id: 'database-connection-high',
      name: 'High Database Connections',
      condition: (metrics) => (metrics.activeConnections as number) > 80, // 80% of max connections
      alertTemplate: {
        type: 'SYSTEM',
        severity: 'MEDIUM',
        title: 'High Database Connection Usage',
        message: 'Database connection pool is heavily utilized',
        metadata: { rule: 'database-connection-high' },
      },
      cooldownMinutes: 30,
      enabled: true,
    });
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    // Slack webhook (if configured)
    const slackWebhookUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    if (slackWebhookUrl) {
      this.addNotificationChannel({
        id: 'slack-main',
        type: 'WEBHOOK',
        name: 'Slack Main Channel',
        config: {
          url: slackWebhookUrl,
          notifyOnResolution: true,
        },
        enabled: true,
      });
    }

    // Email channel (placeholder)
    this.addNotificationChannel({
      id: 'email-ops',
      type: 'EMAIL',
      name: 'Operations Team Email',
      config: {
        recipients: this.configService.get<string[]>(
          'ALERT_EMAIL_RECIPIENTS',
          [],
        ),
        notifyOnResolution: false,
      },
      enabled: false, // Disabled until email service is configured
    });

    // Webhook for external monitoring
    const externalWebhookUrl = this.configService.get<string>(
      'EXTERNAL_MONITORING_WEBHOOK',
    );
    if (externalWebhookUrl) {
      this.addNotificationChannel({
        id: 'external-monitoring',
        type: 'WEBHOOK',
        name: 'External Monitoring System',
        config: {
          url: externalWebhookUrl,
          notifyOnResolution: true,
        },
        enabled: true,
      });
    }
  }

  /**
   * Check if alert is on cooldown
   */
  private isAlertOnCooldown(alert: Alert): boolean {
    const cooldownKey = `${alert.type}_${alert.severity}_${alert.title}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);

    if (!lastAlert) return false;

    // Find matching rule for cooldown period
    const rule = Array.from(this.alertRules.values()).find(
      (r) => r.alertTemplate.title === alert.title,
    );

    if (!rule) return false;

    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    return Date.now() - lastAlert.getTime() < cooldownMs;
  }

  /**
   * Set alert cooldown
   */
  private setAlertCooldown(alert: Alert): void {
    const cooldownKey = `${alert.type}_${alert.severity}_${alert.title}`;
    this.alertCooldowns.set(cooldownKey, new Date());
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    // eslint-disable-next-line sonarjs/pseudo-random
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get severity color for notifications
   */
  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'good';
      case 'LOW':
        return '#808080';
      default:
        return '#808080';
    }
  }
}
