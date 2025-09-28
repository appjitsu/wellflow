import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DomainEvent } from './domain-event';
import type { RegulatoryEventPublisher } from '../../infrastructure/events/regulatory-outbox.service';

/**
 * Regulatory Domain Event Publisher
 * Provides a centralized way for domain entities to publish events through the Outbox pattern
 */
@Injectable()
export class RegulatoryDomainEventPublisher {
  constructor(
    @Inject(forwardRef(() => 'RegulatoryEventPublisher'))
    private readonly eventPublisher: RegulatoryEventPublisher,
  ) {}

  /**
   * Publish a domain event through the regulatory outbox
   */
  async publish(event: DomainEvent, organizationId?: string): Promise<void> {
    await this.eventPublisher.publish(event, organizationId);
  }

  /**
   * Publish multiple domain events through the regulatory outbox
   */
  async publishMany(
    events: DomainEvent[],
    organizationId?: string,
  ): Promise<void> {
    for (const event of events) {
      await this.publish(event, organizationId);
    }
  }
}
