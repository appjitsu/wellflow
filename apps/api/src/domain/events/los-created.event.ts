/**
 * Lease Operating Statement Created Domain Event
 * Raised when a new LOS is created
 */
export class LosCreatedEvent {
  public readonly eventType = 'LosCreated';
  public readonly occurredAt: Date;

  constructor(
    public readonly losId: string,
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly statementMonth: string,
    public readonly totalExpenses?: number,
    public readonly createdBy?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Lease Operating Statement ${this.losId} created for lease ${this.leaseId} for ${this.statementMonth}`;
  }
}
