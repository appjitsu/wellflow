/**
 * Interface for domain events
 * All domain events must implement this interface
 */
export interface DomainEvent {
  /** The type of the event */
  readonly eventType: string;

  /** The aggregate type that raised the event */
  readonly aggregateType: string;

  /** When the event occurred */
  readonly occurredOn: Date;

  /** Unique identifier of the aggregate instance */
  readonly aggregateId: string;
}
