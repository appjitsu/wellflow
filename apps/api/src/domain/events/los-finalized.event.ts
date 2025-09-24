/**
 * Lease Operating Statement Finalized Domain Event
 * Raised when a LOS is finalized and ready for distribution
 */
export class LosFinalizedEvent {
  public readonly eventType = 'LosFinalized';
  public readonly occurredAt: Date;

  constructor(
    public readonly losId: string,
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly statementMonth: string,
    public readonly totalExpenses: number,
    public readonly operatingExpenses: number,
    public readonly capitalExpenses: number,
    public readonly finalizedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Lease Operating Statement ${this.losId} finalized by ${this.finalizedBy} for ${this.statementMonth} with total expenses $${this.totalExpenses.toLocaleString()}`;
  }
}
