/**
 * Revenue Distribution Created Domain Event
 * Raised when a new revenue distribution is created
 */
export class RevenueDistributionCreatedEvent {
  public readonly eventType = 'RevenueDistributionCreated';
  public readonly occurredAt: Date;

  constructor(
    public readonly revenueDistributionId: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly productionMonth: string,
    public readonly netRevenue: number,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Revenue Distribution ${this.revenueDistributionId} created for partner ${this.partnerId} in well ${this.wellId} for ${this.productionMonth} with net revenue $${this.netRevenue.toLocaleString()}`;
  }
}
