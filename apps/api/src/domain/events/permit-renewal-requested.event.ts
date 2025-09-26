import { DomainEvent } from '../shared/domain-event';

/**
 * Event fired when a permit renewal is requested
 */
export class PermitRenewalRequestedEvent implements DomainEvent {
  public readonly eventType = 'PermitRenewalRequested';
  public readonly aggregateType = 'Permit';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly requestedByUserId: string,
    public readonly newExpirationDate: Date,
    public readonly renewalReason: string,
  ) {
    this.occurredOn = new Date();
  }
}
