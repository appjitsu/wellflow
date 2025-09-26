/**
 * User Account Locked Domain Event
 * Raised when a user account is locked due to failed login attempts
 */
export class UserAccountLockedEvent {
  public readonly eventType = 'UserAccountLocked';
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly email: string,
    public readonly failedAttempts: number,
    public readonly lockedUntil: Date,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const locationInfo = this.ipAddress ? ` from ${this.ipAddress}` : '';
    const lockDuration = Math.round(
      (this.lockedUntil.getTime() - Date.now()) / (1000 * 60),
    );
    return `User account ${this.email} locked for ${lockDuration} minutes after ${this.failedAttempts} failed attempts${locationInfo}`;
  }
}
