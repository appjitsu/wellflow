import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';
import { outboxEvents } from '../../database/schemas/outbox-events';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';

// Domain Events
import { DomainEvent } from '../../domain/shared/domain-event';
import { PermitCreatedEvent } from '../../domain/events/permit-created.event';
import { PermitStatusChangedEvent } from '../../domain/events/permit-status-changed.event';
import { PermitExpiredEvent } from '../../domain/events/permit-expired.event';
import { IncidentReportedEvent } from '../../domain/events/incident-reported.event';
import { ReportGeneratedEvent } from '../../domain/events/report-generated.event';
import { ReportSubmittedEvent } from '../../domain/events/report-submitted.event';
import { ReportOverdueEvent } from '../../domain/events/report-overdue.event';
import { MonitoringDataRecordedEvent } from '../../domain/events/monitoring-data-recorded.event';
import { ComplianceLimitExceededEvent } from '../../domain/events/compliance-limit-exceeded.event';

export interface RegulatoryEventPublisher {
  publish(event: DomainEvent, organizationId?: string): Promise<void>;
}

export interface RegulatoryEventHandler {
  handle(event: DomainEvent): Promise<void>;
}

/**
 * Regulatory Outbox Service - implements the Outbox pattern for reliable event publishing
 * Ensures regulatory events are reliably published to external systems
 */
@Injectable()
export class RegulatoryOutboxService
  implements RegulatoryEventPublisher, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RegulatoryOutboxService.name);
  private readonly eventHandlers = new Map<string, RegulatoryEventHandler[]>();
  private processingInterval?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    // Register regulatory event handlers
    await this.registerRegulatoryEventHandlers();

    // Start background processing
    this.startBackgroundProcessing();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onModuleDestroy() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }

  /**
   * Publish a regulatory domain event to the outbox
   */
  async publish(event: DomainEvent, organizationId?: string): Promise<void> {
    const db = this.database.getDb();

    await db.insert(outboxEvents).values({
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      organizationId: organizationId,
      payload: this.serializeEvent(event),
      status: 'pending',
      attempts: 0,
      occurredAt: event.occurredOn,
    });

    this.logger.debug(
      `Regulatory outbox event recorded: ${event.eventType} for ${event.aggregateType}:${event.aggregateId}`,
    );

    // Notify registered handlers immediately for real-time processing
    await this.notifyHandlers(event);
  }

  /**
   * Register an event handler for a specific event type
   */
  registerHandler(eventType: string, handler: RegulatoryEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) {
      this.eventHandlers.set(eventType, [handler]);
    } else {
      handlers.push(handler);
    }
  }

  /**
   * Process pending outbox events (called by background job)
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingEvents(): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;

    try {
      const db = this.database.getDb();

      // Get pending events (limit to avoid processing too many at once)
      const pendingEvents = await db
        .select()
        .from(outboxEvents)
        .where(
          and(
            eq(outboxEvents.status, 'pending'),
            lt(outboxEvents.attempts, 5), // Max 5 attempts
          ),
        )
        .orderBy(outboxEvents.occurredAt)
        .limit(50);

      for (const outboxEvent of pendingEvents) {
        await this.processOutboxEvent(outboxEvent);
      }
    } catch (error) {
      this.logger.error('Error processing pending outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Manually retry failed events
   */
  async retryFailedEvents(eventIds?: string[]): Promise<void> {
    const db = this.database.getDb();

    // Build the where condition
    let whereCondition = and(
      eq(outboxEvents.status, 'failed'),
      lt(outboxEvents.attempts, 5),
    );

    if (eventIds && eventIds.length > 0) {
      const idsList = eventIds.map((id) => `'${id}'`).join(',');
      whereCondition = and(
        whereCondition,
        sql`${outboxEvents.id} IN (${idsList})`,
      );
    }

    await db
      .update(outboxEvents)
      .set({
        status: 'pending',
        attempts: 0,
        error: null,
        processedAt: null,
      })
      .where(whereCondition);
  }

  /**
   * Get event processing statistics
   */
  async getProcessingStats(): Promise<{
    pending: number;
    processed: number;
    failed: number;
    totalAttempts: number;
  }> {
    const db = this.database.getDb();

    const stats = await db
      .select({
        status: outboxEvents.status,
        attempts: outboxEvents.attempts,
      })
      .from(outboxEvents)
      .where(
        gte(
          outboxEvents.occurredAt,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        ),
      ); // Last 30 days

    const result = {
      pending: 0,
      processed: 0,
      failed: 0,
      totalAttempts: 0,
    };

    for (const stat of stats) {
      switch (stat.status) {
        case 'pending':
          result.pending++;
          break;
        case 'processed':
          result.processed++;
          break;
        case 'failed':
          result.failed++;
          break;
      }
      result.totalAttempts += stat.attempts;
    }

    return result;
  }

  // Private methods

  // eslint-disable-next-line @typescript-eslint/require-await
  private async registerRegulatoryEventHandlers(): Promise<void> {
    // Register handlers for regulatory notifications
    this.registerHandler('PermitCreated', {
      handle: async (event) =>
        await this.handlePermitCreated(event as PermitCreatedEvent),
    });

    this.registerHandler('PermitExpired', {
      handle: async (event) =>
        await this.handlePermitExpired(event as PermitExpiredEvent),
    });

    this.registerHandler('IncidentReported', {
      handle: async (event) =>
        await this.handleIncidentReported(event as IncidentReportedEvent),
    });

    this.registerHandler('ReportOverdue', {
      handle: async (event) =>
        await this.handleReportOverdue(event as ReportOverdueEvent),
    });

    this.registerHandler('ComplianceLimitExceeded', {
      handle: async (event) =>
        await this.handleComplianceLimitExceeded(
          event as ComplianceLimitExceededEvent,
        ),
    });
  }

  private startBackgroundProcessing(): void {
    // Process events every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processPendingEvents().catch((error) =>
        this.logger.error('Error in background event processing', error),
      );
    }, 30000);
  }

  private async notifyHandlers(event: DomainEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.eventType) || [];

    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        this.logger.error(
          `Error in event handler for ${event.eventType}:`,
          error,
        );
      }
    }
  }

  private async processOutboxEvent(
    outboxEvent: typeof outboxEvents.$inferSelect,
  ): Promise<void> {
    try {
      const event = this.deserializeEvent(outboxEvent);
      await this.notifyHandlers(event);

      // Mark as processed
      const db = this.database.getDb();
      await db
        .update(outboxEvents)
        .set({
          status: 'processed',
          processedAt: new Date(),
        })
        .where(eq(outboxEvents.id, outboxEvent.id));
    } catch (error) {
      this.logger.error(
        `Failed to process outbox event ${outboxEvent.id}:`,
        error,
      );

      // Update failure status
      const db = this.database.getDb();
      await db
        .update(outboxEvents)
        .set({
          status: 'failed',
          attempts: outboxEvent.attempts + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(outboxEvents.id, outboxEvent.id));
    }
  }

  private serializeEvent(event: DomainEvent): Record<string, unknown> {
    return {
      ...event,
      occurredOn: event.occurredOn.toISOString(),
    };
  }

  private deserializeEvent(
    outboxEvent: typeof outboxEvents.$inferSelect,
  ): DomainEvent {
    const payload = outboxEvent.payload as Record<string, unknown>;

    // Create the appropriate domain event based on eventType
    switch (outboxEvent.eventType) {
      case 'PermitCreated':
        return new PermitCreatedEvent(
          payload.aggregateId as string,
          payload.permitNumber as string,
          payload.permitType as string,
        );
      case 'PermitStatusChanged':
        return new PermitStatusChangedEvent(
          payload.aggregateId as string,
          payload.oldStatus as string,
          payload.newStatus as string,
        );
      case 'PermitExpired':
        return new PermitExpiredEvent(
          payload.aggregateId as string,
          payload.permitNumber as string,
        );
      case 'IncidentReported':
        return new IncidentReportedEvent(
          payload.aggregateId as string,
          payload.incidentNumber as string,
          payload.incidentType as string,
          payload.severity as string,
        );
      case 'ReportGenerated':
        return new ReportGeneratedEvent(
          payload.aggregateId as string,
          payload.reportType as string,
          payload.regulatoryAgency as string,
          payload.reportData as Record<string, unknown>,
        );
      case 'ReportSubmitted':
        return new ReportSubmittedEvent(
          payload.aggregateId as string,
          payload.reportType as string,
          payload.regulatoryAgency as string,
          payload.externalSubmissionId as string,
        );
      case 'ReportOverdue':
        return new ReportOverdueEvent(
          payload.aggregateId as string,
          payload.reportType as string,
          payload.regulatoryAgency as string,
          new Date(payload.dueDate as string),
        );
      case 'MonitoringDataRecorded':
        return new MonitoringDataRecordedEvent(
          payload.aggregateId as string,
          payload.monitoringPointId as string,
          payload.parameter as string,
          payload.measuredValue as number,
        );
      case 'ComplianceLimitExceeded':
        return new ComplianceLimitExceededEvent(
          payload.aggregateId as string,
          payload.monitoringPointId as string,
          payload.parameter as string,
          payload.measuredValue as number,
          payload.complianceLimit as number,
        );
      default:
        throw new Error(`Unknown event type: ${outboxEvent.eventType}`);
    }
  }

  // Event handlers

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handlePermitCreated(event: PermitCreatedEvent): Promise<void> {
    this.logger.log(
      `Permit created: ${event.permitNumber} (${event.aggregateId})`,
    );

    // Send notifications to relevant users

    // await this.notificationService.sendPermitCreatedNotification(event);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handlePermitExpired(event: PermitExpiredEvent): Promise<void> {
    this.logger.warn(
      `Permit expired: ${event.permitNumber} (${event.aggregateId})`,
    );

    // Send urgent notifications for expired permits

    // await this.notificationService.sendPermitExpiredNotification(event);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handleIncidentReported(
    event: IncidentReportedEvent,
  ): Promise<void> {
    this.logger.warn(
      `HSE Incident reported: ${event.incidentNumber} (${event.severity})`,
    );

    // Send immediate notifications for incidents

    // await this.notificationService.sendIncidentReportedNotification(event);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handleReportOverdue(event: ReportOverdueEvent): Promise<void> {
    this.logger.warn(
      `Regulatory report overdue: ${event.aggregateId} (${event.reportType})`,
    );

    // Send escalation notifications for overdue reports

    // await this.notificationService.sendReportOverdueNotification(event);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async handleComplianceLimitExceeded(
    event: ComplianceLimitExceededEvent,
  ): Promise<void> {
    this.logger.error(
      `Compliance limit exceeded: ${event.monitoringPointId} - ${event.parameter} (${event.measuredValue} > ${event.complianceLimit})`,
    );

    // Send critical notifications for compliance violations

    // await this.notificationService.sendComplianceViolationNotification(event);
  }
}
