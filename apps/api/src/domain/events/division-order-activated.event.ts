/**
 * Division Order Activated Domain Event
 * Raised when a division order is activated
 */
export class DivisionOrderActivatedEvent {
  public readonly eventType = 'DivisionOrderActivated';
  public readonly occurredAt: Date;

  constructor(
    public readonly divisionOrderId: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly activatedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Division Order ${this.divisionOrderId} activated by ${this.activatedBy} for partner ${this.partnerId} in well ${this.wellId}`;
  }
}
