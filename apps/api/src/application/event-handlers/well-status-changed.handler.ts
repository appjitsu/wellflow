import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler } from '@nestjs/cqrs';
import { WellStatusChangedEvent } from '../../domain/events/well-status-changed.event';
import { EnhancedEventHandler } from '../../common/events/enhanced-event-handler';
import { AuditLogService } from '../services/audit-log.service';
import { WellStatus } from '../../domain/enums/well-status.enum';

@Injectable()
@EventsHandler(WellStatusChangedEvent)
export class WellStatusChangedHandler extends EnhancedEventHandler<WellStatusChangedEvent> {
  protected override readonly logger = new Logger(
    WellStatusChangedHandler.name,
  );

  constructor(auditLogService?: AuditLogService) {
    super(auditLogService, {
      retryAttempts: 3,
      logLevel: 'info',
      auditEvents: true,
    });
  }

  protected async execute(event: WellStatusChangedEvent): Promise<void> {
    this.logger.log(
      `Processing well status change: ${event.wellId} from ${event.previousStatus} to ${event.newStatus}`,
    );

    // Execute multiple observers
    this.notifyStakeholders(event);
    this.updateComplianceRecords(event);
    this.triggerWorkflowActions(event);
    this.updateMonitoringDashboard(event);
    this.sendNotifications(event);

    this.logger.log(
      `Completed processing well status change for well ${event.wellId}`,
    );

    return Promise.resolve();
  }

  protected override async preHandle(
    event: WellStatusChangedEvent,
  ): Promise<boolean> {
    // Validate that the status transition is allowed
    const validTransitions: Record<string, string[]> = {
      [WellStatus.DRILLING]: [
        WellStatus.ACTIVE,
        WellStatus.INACTIVE,
        WellStatus.PLUGGED,
      ],
      [WellStatus.ACTIVE]: [WellStatus.INACTIVE, WellStatus.PLUGGED],
      [WellStatus.INACTIVE]: [WellStatus.ACTIVE, WellStatus.PLUGGED],
      [WellStatus.PLUGGED]: [], // Terminal state
    };

    const allowedNewStatuses = validTransitions[event.previousStatus] || [];
    return Promise.resolve(allowedNewStatuses.includes(event.newStatus));
  }

  protected override async handleError(
    event: WellStatusChangedEvent,
    error: unknown,
  ): Promise<void> {
    this.logger.error(
      `Critical error processing well status change for well ${event.wellId}:`,
      error,
    );

    // For critical well status changes, we might want to:
    // 1. Send alerts to administrators
    // 2. Create incident reports
    // 3. Rollback the status change if possible

    // For now, we'll just log and rethrow
    return Promise.reject(
      error instanceof Error ? error : new Error(String(error)),
    );
  }

  private notifyStakeholders(event: WellStatusChangedEvent): void {
    // Simulate notifying stakeholders
    this.logger.debug(
      `Notifying stakeholders about well ${event.wellId} status change`,
    );

    // In a real implementation, this would:
    // - Query stakeholders from database
    // - Send emails/SMS notifications
    // - Update notification queues
  }

  private updateComplianceRecords(event: WellStatusChangedEvent): void {
    // Update regulatory compliance tracking
    this.logger.debug(`Updating compliance records for well ${event.wellId}`);

    // In a real implementation, this would:
    // - Update compliance deadlines
    // - Trigger regulatory reporting requirements
    // - Update permit statuses
  }

  private triggerWorkflowActions(event: WellStatusChangedEvent): void {
    // Trigger workflow actions based on status change
    this.logger.debug(`Triggering workflow actions for well ${event.wellId}`);

    // In a real implementation, this would:
    // - Start approval workflows
    // - Trigger maintenance schedules
    // - Update project timelines
  }

  private updateMonitoringDashboard(event: WellStatusChangedEvent): void {
    // Update real-time monitoring dashboards
    this.logger.debug(`Updating monitoring dashboard for well ${event.wellId}`);

    // In a real implementation, this would:
    // - Update dashboard caches
    // - Send websocket updates to clients
    // - Update KPI calculations
  }

  private sendNotifications(event: WellStatusChangedEvent): void {
    // Send notifications to relevant parties
    this.logger.debug(
      `Sending notifications for well ${event.wellId} status change`,
    );

    // In a real implementation, this would:
    // - Send push notifications
    // - Update notification feeds
    // - Trigger alert systems
  }
}
