import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  IObserverRegistry,
  IObserver,
  ObserverPriority,
  ObserverExecutionResult,
} from './observer.interface';
import {
  PermitExpirationObserver,
  PermitStatusChangeObserver,
  IncidentSeverityObserver,
  IncidentReportingObserver,
  ComplianceViolationObserver,
  ReportDeadlineObserver,
  EmailNotificationObserver,
  DashboardUpdateObserver,
} from './regulatory-observers';
import { DomainEvent } from '../shared/domain-event';

/**
 * Regulatory Observer Manager Service
 * Manages all regulatory observers and orchestrates event notifications
 * Integrates with the existing Outbox pattern for reliable event processing
 */
@Injectable()
export class RegulatoryObserverManagerService
  implements IObserverRegistry, OnModuleInit
{
  private readonly logger = new Logger(RegulatoryObserverManagerService.name);

  // Observer storage
  private readonly observers = new Map<string, IObserver>();
  private readonly observersByEventType = new Map<string, IObserver[]>();
  private readonly observersByPriority = new Map<
    ObserverPriority,
    IObserver[]
  >();

  // Execution tracking
  private readonly executionMetrics = new Map<
    string,
    ObserverExecutionResult[]
  >();

  // Enabled state tracking (separate from observer metadata)
  private readonly observerEnabledState = new Map<string, boolean>();

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit(): Promise<void> {
    await this.initializeObservers();
  }

  /**
   * Initialize all regulatory observers
   */
  private async initializeObservers(): Promise<void> {
    try {
      // Initialize permit observers
      const permitExpirationObserver = await this.moduleRef.create(
        PermitExpirationObserver,
      );
      this.register(permitExpirationObserver);

      const permitStatusObserver = await this.moduleRef.create(
        PermitStatusChangeObserver,
      );
      this.register(permitStatusObserver);

      // Initialize incident observers
      const incidentSeverityObserver = await this.moduleRef.create(
        IncidentSeverityObserver,
      );
      this.register(incidentSeverityObserver);

      const incidentReportingObserver = await this.moduleRef.create(
        IncidentReportingObserver,
      );
      this.register(incidentReportingObserver);

      // Initialize compliance observers
      const complianceViolationObserver = await this.moduleRef.create(
        ComplianceViolationObserver,
      );
      this.register(complianceViolationObserver);

      const reportDeadlineObserver = await this.moduleRef.create(
        ReportDeadlineObserver,
      );
      this.register(reportDeadlineObserver);

      // Initialize notification observers
      const emailConfig = {
        recipients: ['compliance@wellflow.com', 'regulatory@wellflow.com'],
        templates: {
          PermitExpired: 'permit-expired-notification',
          IncidentReported: 'incident-reported-notification',
          ReportOverdue: 'report-overdue-notification',
          PermitCreated: 'permit-created-notification',
          ReportSubmitted: 'report-submitted-notification',
        },
      };
      const emailObserver = new EmailNotificationObserver(emailConfig);
      this.register(emailObserver);

      const dashboardObserver = await this.moduleRef.create(
        DashboardUpdateObserver,
      );
      this.register(dashboardObserver);

      this.logger.log(
        `Initialized ${this.observers.size} regulatory observers`,
      );

      this.logObserverStatistics();
    } catch (error) {
      this.logger.error('Failed to initialize observers:', error);
      throw error;
    }
  }

  /**
   * Register an observer
   */
  register(observer: IObserver): void {
    const metadata = observer.getMetadata();

    if (this.observers.has(metadata.observerId)) {
      this.logger.warn(
        `Observer ${metadata.observerId} already registered, skipping`,
      );
      return;
    }

    this.observers.set(metadata.observerId, observer);

    // Track enabled state separately
    this.observerEnabledState.set(metadata.observerId, metadata.enabled);

    // Index by event types
    for (const eventType of metadata.eventTypes) {
      if (!this.observersByEventType.has(eventType)) {
        this.observersByEventType.set(eventType, []);
      }
      const eventObservers = this.observersByEventType.get(eventType);
      if (eventObservers) {
        eventObservers.push(observer);
      }
    }

    // Index by priority
    if (!this.observersByPriority.has(metadata.priority)) {
      this.observersByPriority.set(metadata.priority, []);
    }
    const priorityObservers = this.observersByPriority.get(metadata.priority);
    if (priorityObservers) {
      priorityObservers.push(observer);
    }

    this.logger.debug(
      `Registered observer: ${metadata.observerId} (${metadata.observerType})`,
    );
  }

  /**
   * Unregister an observer
   */
  unregister(observerId: string): boolean {
    const observer = this.observers.get(observerId);
    if (!observer) {
      return false;
    }

    const metadata = observer.getMetadata();

    // Remove from main registry
    this.observers.delete(observerId);

    // Remove from event type indexes
    for (const eventType of metadata.eventTypes) {
      const observers = this.observersByEventType.get(eventType);
      if (observers) {
        const index = observers.indexOf(observer);
        if (index !== -1) {
          observers.splice(index, 1);
        }
      }
    }

    // Remove from priority indexes
    const priorityObservers = this.observersByPriority.get(metadata.priority);
    if (priorityObservers) {
      const index = priorityObservers.indexOf(observer);
      if (index !== -1) {
        priorityObservers.splice(index, 1);
      }
    }

    // Clear execution metrics and enabled state
    this.executionMetrics.delete(observerId);
    this.observerEnabledState.delete(observerId);

    this.logger.debug(`Unregistered observer: ${observerId}`);
    return true;
  }

  /**
   * Get observers for event type
   */
  getObserversForEvent(eventType: string): IObserver[] {
    const specificObservers = this.observersByEventType.get(eventType) || [];
    const wildcardObservers = this.observersByEventType.get('*') || [];

    // Filter only enabled observers
    return [...specificObservers, ...wildcardObservers].filter((observer) => {
      const metadata = observer.getMetadata();
      const isEnabled =
        this.observerEnabledState.get(metadata.observerId) ?? metadata.enabled;
      return isEnabled && observer.canHandle({ eventType } as DomainEvent);
    });
  }

  /**
   * Get all registered observers
   */
  getAllObservers(): IObserver[] {
    return Array.from(this.observers.values());
  }

  /**
   * Enable/disable observer
   */
  setObserverEnabled(observerId: string, enabled: boolean): boolean {
    const observer = this.observers.get(observerId);
    if (!observer) {
      return false;
    }

    // Store enabled state separately from metadata
    this.observerEnabledState.set(observerId, enabled);

    this.logger.debug(
      `Observer ${observerId} ${enabled ? 'enabled' : 'disabled'}`,
    );
    return true;
  }

  /**
   * Notify all relevant observers of an event
   * This is the main entry point from the Outbox processor
   */
  async notifyObservers(event: DomainEvent): Promise<void> {
    const observers = this.getObserversForEvent(event.eventType);

    if (observers.length === 0) {
      this.logger.debug(
        `No observers found for event type: ${event.eventType}`,
      );
      return;
    }

    this.logger.debug(
      `Notifying ${observers.length} observers for event: ${event.eventType}`,
    );

    // Execute observers by priority (critical first)
    const results = await this.executeObserversByPriority(observers, event);

    // Log execution results
    this.logExecutionResults(results);

    // Check for failures and handle accordingly
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      this.logger.warn(
        `${failures.length} observer(s) failed for event ${event.eventType}`,
      );
    }
  }

  /**
   * Execute observers grouped by priority
   */
  private async executeObserversByPriority(
    observers: IObserver[],
    event: DomainEvent,
  ): Promise<ObserverExecutionResult[]> {
    const results: ObserverExecutionResult[] = [];
    const priorityGroups = this.groupObserversByPriority(observers);

    // Execute in priority order (CRITICAL -> HIGH -> MEDIUM -> LOW)
    for (const priority of [
      ObserverPriority.CRITICAL,
      ObserverPriority.HIGH,
      ObserverPriority.MEDIUM,
      ObserverPriority.LOW,
    ]) {
      const priorityObservers = priorityGroups.get(priority) || [];

      if (priorityObservers.length > 0) {
        const priorityResults = await this.executeObserverGroup(
          priorityObservers,
          event,
        );
        results.push(...priorityResults);
      }
    }

    return results;
  }

  /**
   * Execute a group of observers concurrently
   */
  private async executeObserverGroup(
    observers: IObserver[],
    event: DomainEvent,
  ): Promise<ObserverExecutionResult[]> {
    const promises = observers.map(async (observer) => {
      const startTime = Date.now();

      try {
        await observer.update(event);
        const executionTime = Date.now() - startTime;

        const result: ObserverExecutionResult = {
          observerId: observer.getMetadata().observerId,
          eventType: event.eventType,
          success: true,
          executionTime,
        };

        this.trackExecutionMetrics(observer.getMetadata().observerId, result);
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;

        const result: ObserverExecutionResult = {
          observerId: observer.getMetadata().observerId,
          eventType: event.eventType,
          success: false,
          executionTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };

        this.trackExecutionMetrics(observer.getMetadata().observerId, result);
        return result;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Group observers by priority
   */
  private groupObserversByPriority(
    observers: IObserver[],
  ): Map<ObserverPriority, IObserver[]> {
    const groups = new Map<ObserverPriority, IObserver[]>();

    for (const observer of observers) {
      const priority = observer.getMetadata().priority;
      if (!groups.has(priority)) {
        groups.set(priority, []);
      }
      const priorityGroup = groups.get(priority);
      if (priorityGroup) {
        priorityGroup.push(observer);
      }
    }

    return groups;
  }

  /**
   * Track execution metrics for monitoring
   */
  private trackExecutionMetrics(
    observerId: string,
    result: ObserverExecutionResult,
  ): void {
    if (!this.executionMetrics.has(observerId)) {
      this.executionMetrics.set(observerId, []);
    }

    const metrics = this.executionMetrics.get(observerId);
    if (metrics) {
      metrics.push(result);

      // Keep only last 100 results for memory efficiency
      if (metrics.length > 100) {
        metrics.shift();
      }
    }
  }

  /**
   * Get execution metrics for an observer
   */
  getExecutionMetrics(observerId: string): ObserverExecutionResult[] {
    return this.executionMetrics.get(observerId) || [];
  }

  /**
   * Log execution results
   */
  private logExecutionResults(results: ObserverExecutionResult[]): void {
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;
    const totalExecutionTime = results.reduce(
      (sum, r) => sum + r.executionTime,
      0,
    );
    const averageExecutionTime =
      results.length > 0 ? totalExecutionTime / results.length : 0;

    this.logger.log(
      `Observer execution completed: ${successCount} success, ${failureCount} failures, ` +
        `avg time: ${averageExecutionTime.toFixed(2)}ms`,
    );

    if (failureCount > 0) {
      const failures = results.filter((r) => !r.success);
      for (const failure of failures) {
        this.logger.error(
          `Observer ${failure.observerId} failed: ${failure.error} (${failure.executionTime}ms)`,
        );
      }
    }
  }

  /**
   * Log observer statistics
   */
  private logObserverStatistics(): void {
    const stats = this.getObserverStatistics();
    this.logger.log('Regulatory Observer Statistics:', {
      totalObservers: stats.totalObservers,
      enabledObservers: stats.enabledObservers,
      observersByPriority: stats.observersByPriority,
      observersByEventType: stats.observersByEventType,
    });
  }

  /**
   * Get comprehensive observer statistics
   */
  getObserverStatistics(): {
    totalObservers: number;
    enabledObservers: number;
    observersByPriority: Record<string, number>;
    observersByEventType: Record<string, number>;
    executionMetrics: Record<
      string,
      { total: number; success: number; averageTime: number }
    >;
  } {
    const observers = this.getAllObservers();
    const enabledObservers = observers.filter((o) => {
      const metadata = o.getMetadata();
      return (
        this.observerEnabledState.get(metadata.observerId) ?? metadata.enabled
      );
    });

    const observersByPriority: Record<string, number> = {};
    const observersByEventType: Record<string, number> = {};
    const executionMetrics: Record<
      string,
      { total: number; success: number; averageTime: number }
    > = {};

    for (const observer of observers) {
      const metadata = observer.getMetadata();

      // Count by priority
      const priorityKey = ObserverPriority[metadata.priority];
      // eslint-disable-next-line security/detect-object-injection
      const currentPriorityCount = observersByPriority[priorityKey] ?? 0;
      // eslint-disable-next-line security/detect-object-injection
      observersByPriority[priorityKey] = currentPriorityCount + 1;

      // Count by event types
      for (const eventType of metadata.eventTypes) {
        // eslint-disable-next-line security/detect-object-injection
        const currentEventCount = observersByEventType[eventType] ?? 0;
        // eslint-disable-next-line security/detect-object-injection
        observersByEventType[eventType] = currentEventCount + 1;
      }

      // Execution metrics
      const metrics = this.getExecutionMetrics(metadata.observerId);
      if (metrics.length > 0) {
        const success = metrics.filter((m) => m.success).length;
        const averageTime =
          metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length;

        executionMetrics[metadata.observerId] = {
          total: metrics.length,
          success,
          averageTime: Math.round(averageTime * 100) / 100,
        };
      }
    }

    return {
      totalObservers: observers.length,
      enabledObservers: enabledObservers.length,
      observersByPriority,
      observersByEventType,
      executionMetrics,
    };
  }

  /**
   * Health check for observer system
   */
  healthCheck(): Promise<{
    healthy: boolean;
    totalObservers: number;
    enabledObservers: number;
    lastExecutionErrors: string[];
  }> {
    const observers = this.getAllObservers();
    const enabledObservers = observers.filter((o) => {
      const metadata = o.getMetadata();
      return (
        this.observerEnabledState.get(metadata.observerId) ?? metadata.enabled
      );
    });

    // Check for recent failures in execution metrics
    const lastExecutionErrors: string[] = [];
    for (const [observerId, metrics] of this.executionMetrics.entries()) {
      if (metrics.length > 0) {
        const recentFailures = metrics.slice(-5).filter((m) => !m.success);
        if (recentFailures.length > 0) {
          lastExecutionErrors.push(
            `${observerId}: ${recentFailures.length} recent failures`,
          );
        }
      }
    }

    return Promise.resolve({
      healthy: lastExecutionErrors.length === 0,
      totalObservers: observers.length,
      enabledObservers: enabledObservers.length,
      lastExecutionErrors,
    });
  }
}
