import { DomainEvent } from '../shared/domain-event';

/**
 * Domain event raised when a permit status changes
 */
export class PermitStatusChangedEvent implements DomainEvent {
  public readonly eventType = 'PermitStatusChanged';
  public readonly aggregateType = 'Permit';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
  ) {
    this.occurredOn = new Date();
  }
}
