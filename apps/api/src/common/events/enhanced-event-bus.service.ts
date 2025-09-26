import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { EventBus, IEvent, IEventHandler } from '@nestjs/cqrs';
import { Subject, Observable, Subscription } from 'rxjs';
import { filter, bufferTime, map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

export interface EventMetadata {
  eventId: string;
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  source: string;
  version: string;
}

export interface EnhancedEvent extends IEvent {
  metadata: EventMetadata;
}

export interface EventHandlerRegistration {
  eventType: string;
  handler: IEventHandler;
  priority: number; // Higher priority handlers run first
  filter?: (event: IEvent) => boolean;
}

@Injectable()
export class EnhancedEventBusService
  extends EventBus
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EnhancedEventBusService.name);
  private eventStream$ = new Subject<{
    event: IEvent;
    metadata: EventMetadata;
  }>();
  protected override subscriptions: Subscription[] = [];
  private eventHandlers = new Map<string, EventHandlerRegistration[]>();
  private eventMetrics = new Map<
    string,
    {
      totalPublished: number;
      totalProcessed: number;
      totalFailed: number;
      averageProcessingTime: number;
      lastProcessed: Date;
    }
  >();

  onModuleInit() {
    this.setupEventStreamProcessing();
    this.setupMetricsCollection();
  }

  override onModuleDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.eventStream$.complete();
  }

  /**
   * Publish an event with enhanced metadata
   */
  async publishEnhanced<T extends IEvent>(
    event: T,
    source: string = 'system',
    correlationId?: string,
  ): Promise<void> {
    const metadata: EventMetadata = {
      eventId: this.generateEventId(),
      timestamp: new Date(),
      correlationId,
      source,
      version: '1.0',
    };

    const enhancedEvent = {
      ...event,
      metadata,
    } as EnhancedEvent;

    // Publish to standard CQRS event bus
    await super.publish(enhancedEvent);

    // Publish to enhanced stream
    this.eventStream$.next({ event: enhancedEvent, metadata });

    // Update metrics
    this.updateEventMetrics(event.constructor.name, 'published');
  }

  /**
   * Register an event handler with enhanced features
   */
  registerEnhancedHandler(
    eventType: string,
    handler: IEventHandler,
    priority: number = 0,
    filter?: (event: IEvent) => boolean,
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.push({
        eventType,
        handler,
        priority,
        filter,
      });

      // Sort by priority (higher priority first)
      handlers.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Get event stream as observable
   */
  getEventStream(): Observable<{ event: IEvent; metadata: EventMetadata }> {
    return this.eventStream$.asObservable();
  }

  /**
   * Get events of specific type
   */
  getEventsOfType<T extends IEvent>(
    eventType: new (...args: unknown[]) => T,
  ): Observable<{ event: T; metadata: EventMetadata }> {
    return this.eventStream$.pipe(
      filter(({ event }) => event instanceof eventType),
      map(({ event, metadata }) => ({ event: event as T, metadata })),
    );
  }

  /**
   * Get event metrics
   */
  getEventMetrics(): Record<string, unknown> {
    const metrics = new Map<string, unknown>();

    for (const [eventType, metric] of this.eventMetrics) {
      const safeEventType = String(eventType);
      if (
        safeEventType &&
        typeof safeEventType === 'string' &&
        safeEventType.length > 0
      ) {
        const sanitizedKey = safeEventType.replace(/[^a-zA-Z0-9_-]/g, '_');
        metrics.set(sanitizedKey, { ...metric });
      }
    }

    return Object.fromEntries(metrics);
  }

  /**
   * Replay events from a specific point in time
   */
  async replayEvents(
    fromTimestamp: Date,
    eventTypes?: string[],
    _handler?: (event: IEvent, metadata: EventMetadata) => Promise<void>,
  ): Promise<void> {
    // In a real implementation, this would replay from event store
    // For now, we'll just log the request
    const eventTypesStr = eventTypes?.join(', ') || 'all';
    this.logger.log(
      `Event replay requested from ${fromTimestamp.toISOString()} for types: ${eventTypesStr}`,
    );
    return Promise.resolve();
  }

  /**
   * Publish events in batch for better performance
   */
  async publishBatch(
    events: IEvent[],
    source: string = 'system',
  ): Promise<void> {
    const promises = events.map((event) => this.publishEnhanced(event, source));
    await Promise.all(promises);
  }

  /**
   * Override the standard publish method to add metadata
   */
  override async publish<T extends IEvent>(event: T): Promise<void> {
    await this.publishEnhanced(event);
  }

  private setupEventStreamProcessing(): void {
    // Process events in batches every 100ms
    const batchSubscription = this.eventStream$
      .pipe(
        bufferTime(100),
        filter((batch) => batch.length > 0),
      )
      .subscribe({
        next: (batch) => {
          this.logger.debug(`Processing batch of ${batch.length} events`);
          // Here you could add batch processing logic
        },
        error: (error) => {
          this.logger.error('Error in event stream processing:', error);
        },
      });

    this.subscriptions.push(batchSubscription);

    // Log events for monitoring
    const loggingSubscription = this.eventStream$
      .pipe(filter(({ event }) => this.shouldLogEvent(event)))
      .subscribe({
        next: ({ event, metadata }) => {
          this.logger.debug(`Event published: ${event.constructor.name}`, {
            eventId: metadata.eventId,
            correlationId: metadata.correlationId,
            timestamp: metadata.timestamp,
          });
        },
      });

    this.subscriptions.push(loggingSubscription);
  }

  private setupMetricsCollection(): void {
    // Collect metrics every minute
    const metricsSubscription = this.eventStream$
      .pipe(bufferTime(60000)) // 1 minute
      .subscribe({
        next: (events) => {
          this.logger.debug(
            `Processed ${events.length} events in the last minute`,
          );
          // Update detailed metrics here
        },
      });

    this.subscriptions.push(metricsSubscription);
  }

  private generateEventId(): string {
    const randomPart = randomUUID().substring(0, 8);
    return `evt_${Date.now()}_${randomPart}`;
  }

  private shouldLogEvent(event: IEvent): boolean {
    // Define which events should be logged
    const loggableEvents = [
      'WellCreatedEvent',
      'WellStatusChangedEvent',
      'UserLoggedInEvent',
      'UserLoggedOutEvent',
    ];

    return loggableEvents.includes(event.constructor.name);
  }

  private updateEventMetrics(
    eventType: string,
    action: 'published' | 'processed' | 'failed',
  ): void {
    if (!this.eventMetrics.has(eventType)) {
      this.eventMetrics.set(eventType, {
        totalPublished: 0,
        totalProcessed: 0,
        totalFailed: 0,
        averageProcessingTime: 0,
        lastProcessed: new Date(),
      });
    }

    const metrics = this.eventMetrics.get(eventType);
    if (!metrics) return;

    switch (action) {
      case 'published':
        metrics.totalPublished++;
        break;
      case 'processed':
        metrics.totalProcessed++;
        metrics.lastProcessed = new Date();
        break;
      case 'failed':
        metrics.totalFailed++;
        break;
    }
  }
}
