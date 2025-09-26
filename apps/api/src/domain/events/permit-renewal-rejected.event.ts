import { DomainEvent } from '../shared/domain-event';

/**
 * Event fired when a permit renewal is rejected
 */
export class PermitRenewalRejectedEvent implements DomainEvent {
  public readonly eventType = 'PermitRenewalRejected';
  public readonly aggregateType = 'Permit';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly rejectedByUserId: string,
    public readonly rejectionReason: string,
  ) {
    this.occurredOn = new Date();
  }
}
