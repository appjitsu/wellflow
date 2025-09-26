/**
 * User Registered Domain Event
 * Raised when a new user registers in the system
 */
export class UserRegisteredEvent {
  public readonly eventType = 'UserRegistered';
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: string,
    public readonly requiresEmailVerification: boolean = true,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `User ${this.email} (${this.firstName} ${this.lastName}) registered with role ${this.role} in organization ${this.organizationId}`;
  }
}
