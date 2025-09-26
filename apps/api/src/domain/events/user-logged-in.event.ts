/**
 * User Logged In Domain Event
 * Raised when a user successfully logs into the system
 */
export class UserLoggedInEvent {
  public readonly eventType = 'UserLoggedIn';
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly email: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly sessionId?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const locationInfo = this.ipAddress ? ` from ${this.ipAddress}` : '';
    return `User ${this.email} logged in${locationInfo}`;
  }
}
