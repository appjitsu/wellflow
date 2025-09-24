/**
 * Lease Operating Statement Distributed Domain Event
 * Raised when a LOS is distributed to partners/stakeholders
 */
export class LosDistributedEvent {
  public readonly eventType = 'LosDistributed';
  public readonly occurredAt: Date;

  constructor(
    public readonly losId: string,
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly statementMonth: string,
    public readonly totalExpenses: number,
    public readonly distributedBy: string,
    public readonly distributionMethod: string, // email, portal, etc.
    public readonly recipientCount: number,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Lease Operating Statement ${this.losId} distributed by ${this.distributedBy} to ${this.recipientCount} recipients via ${this.distributionMethod}`;
  }
}
