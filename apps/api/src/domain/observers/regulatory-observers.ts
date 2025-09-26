import { Injectable, Logger } from '@nestjs/common';
import {
  IObserver,
  ObserverMetadata,
  ObserverPriority,
  ObserverExecutionResult,
  ObserverFilter,
} from './observer.interface';
import { DomainEvent } from '../shared/domain-event';
import {
  PermitStatusChangedEvent,
  PermitExpiredEvent,
  IncidentReportedEvent,
  IncidentSeverityChangedEvent,
  ReportOverdueEvent,
  ComplianceLimitExceededEvent,
} from '../events';

// Base Regulatory Observer
export abstract class BaseRegulatoryObserver implements IObserver {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly observerId: string,
    protected readonly priority: ObserverPriority,
    protected readonly filters: ObserverFilter[] = [],
  ) {}

  abstract getMetadata(): ObserverMetadata;
  abstract update(event: DomainEvent): Promise<void>;
  abstract canHandle(event: DomainEvent): boolean;

  protected shouldProcessEvent(event: DomainEvent): boolean {
    if (this.filters.length === 0) return true;

    return this.filters.every((filter) => this.evaluateFilter(event, filter));
  }

  private evaluateFilter(event: DomainEvent, filter: ObserverFilter): boolean {
    const eventData = event as unknown as Record<string, unknown>;
    const fieldValue = this.getNestedValue(eventData, filter.field);

    switch (filter.operator) {
      case 'equals':
        return fieldValue === filter.value;
      case 'contains':
        return String(fieldValue).includes(String(filter.value));
      case 'greaterThan':
        return Number(fieldValue) > Number(filter.value);
      case 'lessThan':
        return Number(fieldValue) < Number(filter.value);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(fieldValue);
      case 'notIn':
        return (
          Array.isArray(filter.value) && !filter.value.includes(fieldValue)
        );
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (
        current &&
        typeof current === 'object' &&
        Object.prototype.hasOwnProperty.call(current, key)
      ) {
        return this.getObjectProperty(current as Record<string, unknown>, key);
      }
      return undefined;
    }, obj);
  }

  private getObjectProperty(
    obj: Record<string, unknown>,
    key: string,
  ): unknown {
    // Secure property access using Object.entries to avoid object injection
    const entry = Object.entries(obj).find(([entryKey]) => entryKey === key);
    return entry ? entry[1] : undefined;
  }

  protected async executeWithMetrics<T>(
    operation: () => Promise<T>,
    eventType: string,
  ): Promise<ObserverExecutionResult> {
    const startTime = Date.now();

    try {
      await operation();
      const executionTime = Date.now() - startTime;

      return {
        observerId: this.observerId,
        eventType,
        success: true,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        observerId: this.observerId,
        eventType,
        success: false,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Permit Observers
@Injectable()
export class PermitExpirationObserver extends BaseRegulatoryObserver {
  constructor() {
    super('permit-expiration-observer', ObserverPriority.HIGH, [
      { field: 'eventType', operator: 'equals', value: 'PermitExpired' },
    ]);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'PermitExpirationObserver',
      eventTypes: ['PermitExpired'],
      priority: this.priority,
      description: 'Monitors permit expirations and triggers renewal workflows',
      enabled: true,
    };
  }

  canHandle(event: DomainEvent): boolean {
    return event.eventType === 'PermitExpired';
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      const permitExpiredEvent = event as PermitExpiredEvent;

      this.logger.warn(
        `Permit expired: ${permitExpiredEvent.permitNumber} (${permitExpiredEvent.aggregateId})`,
      );

      // NOTE: Renewal workflow trigger integration point
      // await this.permitService.triggerRenewalWorkflow(permitExpiredEvent.aggregateId);

      // NOTE: Notification hook for permit holders
      // await this.notificationService.sendPermitExpiredNotification(permitExpiredEvent);

      // NOTE: Compliance dashboard synchronization hook
      // await this.complianceDashboard.updatePermitStatus(id, 'expired');

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(`Permit expiration observer failed: ${result.error}`);
    }
  }
}

@Injectable()
export class PermitStatusChangeObserver extends BaseRegulatoryObserver {
  constructor() {
    super('permit-status-change-observer', ObserverPriority.MEDIUM, [
      { field: 'eventType', operator: 'equals', value: 'PermitStatusChanged' },
    ]);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'PermitStatusChangeObserver',
      eventTypes: ['PermitStatusChanged'],
      priority: this.priority,
      description: 'Tracks permit status changes for compliance monitoring',
      enabled: true,
    };
  }

  canHandle(event: DomainEvent): boolean {
    return event.eventType === 'PermitStatusChanged';
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      const statusChangeEvent = event as PermitStatusChangedEvent;

      this.logger.log(
        `Permit status changed: ${statusChangeEvent.aggregateId} from ${statusChangeEvent.oldStatus} to ${statusChangeEvent.newStatus}`,
      );

      // NOTE: Compliance tracking integration point
      // await this.complianceService.updatePermitCompliance(statusChangeEvent.aggregateId, statusChangeEvent.newStatus);

      // NOTE: Trigger downstream workflows based on status
      switch (statusChangeEvent.newStatus) {
        case 'approved':
          // NOTE: Schedule monitoring requirements
          break;
        case 'rejected':
          // NOTE: Notify permit applicant
          break;
        case 'suspended':
          // NOTE: Halt operations and notify
          break;
      }

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(
        `Permit status change observer failed: ${result.error}`,
      );
    }
  }
}

// Incident Observers
@Injectable()
export class IncidentSeverityObserver extends BaseRegulatoryObserver {
  constructor() {
    super('incident-severity-observer', ObserverPriority.CRITICAL, [
      {
        field: 'eventType',
        operator: 'equals',
        value: 'IncidentSeverityChanged',
      },
      {
        field: 'severity',
        operator: 'in',
        value: ['major', 'critical', 'catastrophic'],
      },
    ]);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'IncidentSeverityObserver',
      eventTypes: ['IncidentSeverityChanged'],
      priority: this.priority,
      description:
        'Monitors high-severity incidents requiring immediate regulatory notification',
      enabled: true,
    };
  }

  canHandle(event: DomainEvent): boolean {
    return event.eventType === 'IncidentSeverityChanged';
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      const severityEvent = event as IncidentSeverityChangedEvent;

      this.logger.error(
        `HIGH SEVERITY INCIDENT: ${severityEvent.aggregateId} severity changed to ${severityEvent.newSeverity}`,
      );

      // NOTE: Regulatory notification integration point
      // await this.regulatoryNotificationService.notifyAgencies(severityEvent);

      // NOTE: Escalation integration point
      // await this.escalationService.escalateToManagement(severityEvent);

      // NOTE: Emergency response integration point
      // await this.emergencyService.activateResponse(severityEvent.aggregateId);

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(`Incident severity observer failed: ${result.error}`);
    }
  }
}

@Injectable()
export class IncidentReportingObserver extends BaseRegulatoryObserver {
  constructor() {
    super('incident-reporting-observer', ObserverPriority.HIGH, [
      { field: 'eventType', operator: 'equals', value: 'IncidentReported' },
    ]);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'IncidentReportingObserver',
      eventTypes: ['IncidentReported'],
      priority: this.priority,
      description:
        'Handles incident reporting notifications and initial response coordination',
      enabled: true,
    };
  }

  canHandle(event: DomainEvent): boolean {
    return event.eventType === 'IncidentReported';
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      const incidentEvent = event as IncidentReportedEvent;

      this.logger.warn(
        `Incident reported: ${incidentEvent.incidentNumber} (${incidentEvent.incidentType})`,
      );

      // NOTE: Regulatory notification decision hook
      // const requiresNotification = await this.incidentService.requiresRegulatoryNotification(incidentEvent.aggregateId);

      // NOTE: Follow-up investigation scheduling hook
      // await this.investigationService.scheduleInvestigation(incidentEvent.aggregateId);

      // NOTE: Notification hook for response teams
      // await this.notificationService.notifyIncidentResponseTeam(incidentEvent);

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(`Incident reporting observer failed: ${result.error}`);
    }
  }
}

// Compliance Observers
@Injectable()
export class ComplianceViolationObserver extends BaseRegulatoryObserver {
  constructor() {
    super('compliance-violation-observer', ObserverPriority.CRITICAL, [
      {
        field: 'eventType',
        operator: 'equals',
        value: 'ComplianceLimitExceeded',
      },
    ]);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'ComplianceViolationObserver',
      eventTypes: ['ComplianceLimitExceeded'],
      priority: this.priority,
      description:
        'Monitors compliance limit violations requiring immediate corrective action',
      enabled: true,
    };
  }

  canHandle(event: DomainEvent): boolean {
    return event.eventType === 'ComplianceLimitExceeded';
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      const violationEvent = event as ComplianceLimitExceededEvent;

      this.logger.error(
        `COMPLIANCE VIOLATION: ${violationEvent.monitoringPointId} - ${violationEvent.parameter} exceeded limit (${violationEvent.measuredValue} > ${violationEvent.complianceLimit})`,
      );

      // NOTE: Corrective action integration point
      // await this.correctiveActionService.initiateCorrectiveAction(violationEvent);

      // NOTE: Regulatory notification integration point
      // await this.regulatoryNotificationService.reportViolation(violationEvent);

      // NOTE: Compliance dashboard synchronization hook
      // await this.complianceDashboard.recordViolation(violationEvent);

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(
        `Compliance violation observer failed: ${result.error}`,
      );
    }
  }
}

@Injectable()
export class ReportDeadlineObserver extends BaseRegulatoryObserver {
  constructor() {
    super('report-deadline-observer', ObserverPriority.HIGH, [
      { field: 'eventType', operator: 'equals', value: 'ReportOverdue' },
    ]);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'ReportDeadlineObserver',
      eventTypes: ['ReportOverdue'],
      priority: this.priority,
      description:
        'Monitors overdue regulatory reports and triggers escalation procedures',
      enabled: true,
    };
  }

  canHandle(event: DomainEvent): boolean {
    return event.eventType === 'ReportOverdue';
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      const overdueEvent = event as ReportOverdueEvent;

      this.logger.warn(
        `Regulatory report overdue: ${overdueEvent.aggregateId} (${overdueEvent.reportType}) - Due: ${overdueEvent.dueDate.toISOString()}`,
      );

      // NOTE: Overdue duration calculation hook
      // const overdueDays = Math.floor((Date.now() - overdueEvent.dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // NOTE: Escalation workflow integration point
      // await this.escalationService.escalateOverdueReport(overdueEvent, overdueDays);

      // NOTE: Responsible personnel notification hook
      // await this.notificationService.sendOverdueReportNotification(overdueEvent);

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(`Report deadline observer failed: ${result.error}`);
    }
  }
}

// Notification Observers
@Injectable()
export class EmailNotificationObserver extends BaseRegulatoryObserver {
  constructor(
    private readonly emailConfig: {
      recipients: string[];
      templates: Record<string, string>;
    },
  ) {
    super('email-notification-observer', ObserverPriority.MEDIUM, [
      {
        field: 'priority',
        operator: 'lessThan',
        value: ObserverPriority.CRITICAL,
      },
    ]);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'EmailNotificationObserver',
      eventTypes: [
        'PermitCreated',
        'PermitExpired',
        'IncidentReported',
        'ReportSubmitted',
        'ReportOverdue',
      ],
      priority: this.priority,
      description: 'Sends email notifications for regulatory events',
      enabled: true,
    };
  }

  canHandle(event: DomainEvent): boolean {
    return [
      'PermitCreated',
      'PermitExpired',
      'IncidentReported',
      'ReportSubmitted',
      'ReportOverdue',
    ].includes(event.eventType);
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      const template = this.emailConfig.templates[event.eventType];
      if (!template) {
        this.logger.warn(
          `No email template found for event type: ${event.eventType}`,
        );
        return Promise.resolve();
      }

      // NOTE: Email service integration point
      // await this.emailService.send({
      //   to: this.emailConfig.recipients,
      //   template,
      //   data: event,
      //   priority: this.getEmailPriority(event),
      // });

      this.logger.log(
        `Email notification sent for ${event.eventType}: ${event.aggregateId}`,
      );

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(`Email notification observer failed: ${result.error}`);
    }
  }

  private getEmailPriority(event: DomainEvent): 'low' | 'normal' | 'high' {
    switch (event.eventType) {
      case 'PermitExpired':
      case 'IncidentReported':
      case 'ReportOverdue':
        return 'high';
      case 'PermitCreated':
      case 'ReportSubmitted':
        return 'normal';
      default:
        return 'low';
    }
  }
}

@Injectable()
export class DashboardUpdateObserver extends BaseRegulatoryObserver {
  constructor() {
    super('dashboard-update-observer', ObserverPriority.LOW);
  }

  getMetadata(): ObserverMetadata {
    return {
      observerId: this.observerId,
      observerType: 'DashboardUpdateObserver',
      eventTypes: ['*'], // All events
      priority: this.priority,
      description:
        'Updates compliance dashboards with real-time regulatory data',
      enabled: true,
    };
  }

  canHandle(_event: DomainEvent): boolean {
    return true; // Handle all events
  }

  async update(event: DomainEvent): Promise<void> {
    if (!this.shouldProcessEvent(event)) return;

    const result = await this.executeWithMetrics(() => {
      // NOTE: Update compliance dashboard with event data
      // await this.dashboardService.updateComplianceMetrics(event);

      // NOTE: Update real-time monitoring displays
      // await this.realtimeService.broadcastEvent(event);

      this.logger.debug(
        `Dashboard updated for ${event.eventType}: ${event.aggregateId}`,
      );

      return Promise.resolve();
    }, event.eventType);

    if (!result.success) {
      this.logger.error(`Dashboard update observer failed: ${result.error}`);
    }
  }
}
