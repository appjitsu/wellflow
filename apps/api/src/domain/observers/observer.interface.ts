import { DomainEvent } from '../shared/domain-event';

/**
 * Observer interface for the Observer pattern
 */
export interface IObserver<TEvent extends DomainEvent = DomainEvent> {
  /**
   * Update method called when an observed event occurs
   */
  update(event: TEvent): Promise<void>;

  /**
   * Get observer metadata
   */
  getMetadata(): ObserverMetadata;

  /**
   * Check if observer can handle the given event
   */
  canHandle(event: DomainEvent): boolean;
}

/**
 * Observer metadata
 */
export interface ObserverMetadata {
  observerId: string;
  observerType: string;
  eventTypes: string[];
  priority: ObserverPriority;
  description: string;
  enabled: boolean;
}

/**
 * Observer priority levels
 */
export enum ObserverPriority {
  CRITICAL = 1, // Immediate action required (safety incidents, violations)
  HIGH = 2, // Urgent notifications (deadlines, approvals)
  MEDIUM = 3, // Standard notifications (status changes, updates)
  LOW = 4, // Informational updates (logs, metrics)
}

/**
 * Observable interface for subjects that can be observed
 */
export interface IObservable {
  /**
   * Attach an observer
   */
  attach(observer: IObserver): void;

  /**
   * Detach an observer
   */
  detach(observer: IObserver): void;

  /**
   * Notify all observers of an event
   */
  notify(event: DomainEvent): Promise<void>;

  /**
   * Get list of attached observers
   */
  getObservers(): IObserver[];
}

/**
 * Observer registry for managing observers
 */
export interface IObserverRegistry {
  /**
   * Register an observer
   */
  register(observer: IObserver): void;

  /**
   * Unregister an observer
   */
  unregister(observerId: string): boolean;

  /**
   * Get observers for event type
   */
  getObserversForEvent(eventType: string): IObserver[];

  /**
   * Get all registered observers
   */
  getAllObservers(): IObserver[];

  /**
   * Enable/disable observer
   */
  setObserverEnabled(observerId: string, enabled: boolean): boolean;
}

/**
 * Observer factory interface
 */
export interface IObserverFactory {
  /**
   * Create observer instance
   */
  createObserver(config: ObserverConfig): Promise<IObserver>;

  /**
   * Get supported observer types
   */
  getSupportedTypes(): string[];
}

/**
 * Observer configuration
 */
export interface ObserverConfig {
  observerId: string;
  observerType: string;
  priority: ObserverPriority;
  configuration: Record<string, unknown>;
  filters?: ObserverFilter[];
}

/**
 * Observer filter for conditional notifications
 */
export interface ObserverFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
  value: unknown;
  condition?: 'AND' | 'OR';
}

/**
 * Observer execution result
 */
export interface ObserverExecutionResult {
  observerId: string;
  eventType: string;
  success: boolean;
  executionTime: number;
  error?: string;
  metadata?: Record<string, unknown>;
}
