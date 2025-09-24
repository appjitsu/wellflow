/**
 * Division Order Deactivated Domain Event
 * Raised when a division order is deactivated
 */
export class DivisionOrderDeactivatedEvent {
  public readonly eventType = 'DivisionOrderDeactivated';
  public readonly occurredAt: Date;

  constructor(
    public readonly divisionOrderId: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly endDate: Date,
    public readonly deactivatedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Division Order ${this.divisionOrderId} deactivated by ${this.deactivatedBy} for partner ${this.partnerId} in well ${this.wellId}, ending ${this.endDate.toISOString().split('T')[0]}`;
  }
}
