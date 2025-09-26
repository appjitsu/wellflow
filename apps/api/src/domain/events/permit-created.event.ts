import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when a new permit is created
 */
export class PermitCreatedEvent implements DomainEvent {
  public readonly eventType = 'PermitCreated';
  public readonly aggregateType = 'Permit';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly permitNumber: string,
    public readonly permitType: string,
  ) {
    this.occurredOn = new Date();
  }
}
