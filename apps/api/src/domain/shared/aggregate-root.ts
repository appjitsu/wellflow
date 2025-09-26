import { DomainEvent } from './domain-event';
import type { Entity } from '../../infrastructure/repositories/unit-of-work';

/**
 * Base class for all aggregate roots in the domain
 * Provides common functionality for domain events and aggregate state management
 */
export abstract class AggregateRoot implements Entity {
  private domainEvents: DomainEvent[] = [];
  private version: number = 0;

  /**
   * Get all domain events
   */
  getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents];
  }

  /**
   * Add a domain event
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Clear all domain events
   */
  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  /**
   * Check if aggregate has domain events
   */
  hasDomainEvents(): boolean {
    return this.domainEvents.length > 0;
  }

  /**
   * Publish domain events through the outbox (called after successful persistence)
   */
  async publishDomainEvents(
    eventPublisher: {
      publish: (event: DomainEvent, organizationId?: string) => Promise<void>;
    },
    organizationId?: string,
  ): Promise<void> {
    for (const event of this.domainEvents) {
      await eventPublisher.publish(event, organizationId);
    }
    this.clearDomainEvents();
  }

  /**
   * Get the entity ID (abstract - must be implemented by concrete classes)
   */
  abstract getId(): { getValue(): string };

  /**
   * Get the entity version
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Increment the entity version
   */
  incrementVersion(): void {
    this.version++;
  }
}
