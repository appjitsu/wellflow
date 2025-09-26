import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when a permit expires
 */
export class PermitExpiredEvent implements DomainEvent {
  public readonly eventType = 'PermitExpired';
  public readonly aggregateType = 'Permit';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly permitNumber: string,
  ) {
    this.occurredOn = new Date();
  }
}
