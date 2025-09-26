/**
 * User Email Verified Domain Event
 * Raised when a user successfully verifies their email address
 */
export class UserEmailVerifiedEvent {
  public readonly eventType = 'UserEmailVerified';
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly email: string,
    public readonly verifiedAt: Date,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const locationInfo = this.ipAddress ? ` from ${this.ipAddress}` : '';
    return `User ${this.email} verified their email address${locationInfo}`;
  }
}
