import { DomainEvent } from '../shared/domain-event';

/**
 * Event fired when a permit renewal is approved
 */
export class PermitRenewalApprovedEvent implements DomainEvent {
  public readonly eventType = 'PermitRenewalApproved';
  public readonly aggregateType = 'Permit';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly approvedByUserId: string,
    public readonly newExpirationDate: Date,
  ) {
    this.occurredOn = new Date();
  }
}
