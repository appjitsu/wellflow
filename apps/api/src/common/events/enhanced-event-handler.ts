import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { IEventHandler, IEvent } from '@nestjs/cqrs';
import { AuditLogService } from '../../application/services/audit-log.service';
import {
  AuditResourceType,
  AuditAction,
} from '../../domain/entities/audit-log.entity';
import { EnhancedEvent } from './enhanced-event-bus.service';

export interface EventHandlerOptions {
  retryAttempts?: number;
  retryDelay?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  auditEvents?: boolean;
  circuitBreakerEnabled?: boolean;
}

@Injectable()
export abstract class EnhancedEventHandler<T extends IEvent>
  implements IEventHandler<T>
{
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly options: Required<EventHandlerOptions>;

  constructor(
    @Optional() protected readonly auditLogService?: AuditLogService,
    options: EventHandlerOptions = {},
  ) {
    this.options = {
      retryAttempts: 3,
      retryDelay: 1000,
      logLevel: 'info',
      auditEvents: true,
      circuitBreakerEnabled: false,
      ...options,
    };
  }

  async handle(event: T): Promise<void> {
    const startTime = Date.now();
    const eventName = event.constructor.name;
    const eventId = (event as any).metadata?.eventId || 'unknown';

    try {
      this.logger.log(`Handling event: ${eventName} (${eventId})`);

      // Pre-handle validation
      if (!(await this.preHandle(event))) {
        this.logger.warn(`Event ${eventName} rejected by preHandle filter`);
        return;
      }

      // Execute the main handling logic with retry
      await this.executeWithRetry(event);

      // Post-handle cleanup
      await this.postHandle(event);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Successfully handled event: ${eventName} in ${duration}ms`,
      );

      // Audit successful event handling
      if (this.options.auditEvents && this.auditLogService) {
        await this.auditLogService.logAction(
          AuditAction.EXECUTE,
          AuditResourceType.SYSTEM,
          `event-handler-${eventName}`,
          true,
          undefined,
          {},
          {
            eventId,
            eventType: eventName,
            handler: this.constructor.name,
            duration,
            businessContext: {
              eventData: this.sanitizeEventData(event),
            },
          },
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to handle event ${eventName} (${eventId}) after ${duration}ms:`,
        error,
      );

      // Audit failed event handling
      if (this.options.auditEvents && this.auditLogService) {
        await this.auditLogService.logAction(
          AuditAction.EXECUTE,
          AuditResourceType.SYSTEM,
          `event-handler-${eventName}-failed`,
          false,
          error instanceof Error ? error.message : 'Unknown error',
          {},
          {
            eventId,
            eventType: eventName,
            handler: this.constructor.name,
            duration,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        );
      }

      // Execute error handling strategy
      await this.handleError(event, error);
    }
  }

  /**
   * Main event handling logic - must be implemented by subclasses
   */
  protected abstract execute(event: T): Promise<void>;

  /**
   * Pre-handle validation/filtering
   */
  protected async preHandle(event: T): Promise<boolean> {
    return true; // Allow all events by default
  }

  /**
   * Post-handle cleanup
   */
  protected async postHandle(event: T): Promise<void> {
    // Default: no cleanup needed
  }

  /**
   * Error handling strategy
   */
  protected async handleError(event: T, error: unknown): Promise<void> {
    // Default: rethrow the error
    throw error;
  }

  /**
   * Execute with retry logic
   */
  private async executeWithRetry(event: T): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        await this.execute(event);
        return; // Success
      } catch (error) {
        lastError = error;

        if (attempt < this.options.retryAttempts) {
          this.logger.warn(
            `Event handling attempt ${attempt} failed, retrying in ${this.options.retryDelay}ms:`,
            error instanceof Error ? error.message : error,
          );

          await this.delay(this.options.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  /**
   * Sanitize event data for logging
   */
  protected sanitizeEventData(event: T): Record<string, unknown> {
    const data = { ...event } as any;

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'privateKey',
    ];
    sensitiveFields.forEach((field) => {
      if (data[field]) {
        data[field] = '[REDACTED]';
      }
    });

    return data;
  }

  /**
   * Get event metadata if available
   */
  protected getEventMetadata(event: T): any {
    return (event as any).metadata || {};
  }

  /**
   * Check if this handler should process the event
   */
  protected shouldHandle(event: T): boolean {
    return true; // Handle all events by default
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
