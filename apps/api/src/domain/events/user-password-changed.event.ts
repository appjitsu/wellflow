import { DomainEvent } from '../shared/domain-event';

/**
 * User Password Changed Domain Event
 * Raised when a user successfully changes their password
 */
export class UserPasswordChangedEvent implements DomainEvent {
  public readonly eventType = 'UserPasswordChanged';
  public readonly aggregateType = 'User';
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly organizationId: string,
    public readonly email: string,
  ) {
    this.occurredOn = new Date();
  }

  toString(): string {
    return `User ${this.email} changed their password`;
  }
}
