/**
 * Division Order Updated Domain Event
 * Raised when a division order's decimal interest is updated
 */
export class DivisionOrderUpdatedEvent {
  public readonly eventType = 'DivisionOrderUpdated';
  public readonly occurredAt: Date;

  constructor(
    public readonly divisionOrderId: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly previousDecimalInterest: number,
    public readonly newDecimalInterest: number,
    public readonly updatedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Division Order ${this.divisionOrderId} updated by ${this.updatedBy}: decimal interest changed from ${(this.previousDecimalInterest * 100).toFixed(6)}% to ${(this.newDecimalInterest * 100).toFixed(6)}%`;
  }
}
