/**
 * Division Order Created Domain Event
 * Raised when a new division order is created
 */
export class DivisionOrderCreatedEvent {
  public readonly eventType = 'DivisionOrderCreated';
  public readonly occurredAt: Date;

  constructor(
    public readonly divisionOrderId: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly decimalInterest: number,
    public readonly effectiveDate: Date,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Division Order ${this.divisionOrderId} created for partner ${this.partnerId} in well ${this.wellId} with ${(this.decimalInterest * 100).toFixed(6)}% interest`;
  }
}
