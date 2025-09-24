/**
 * Revenue Distribution Calculated Domain Event
 * Raised when a revenue distribution is recalculated
 */
export class RevenueDistributionCalculatedEvent {
  public readonly eventType = 'RevenueDistributionCalculated';
  public readonly occurredAt: Date;

  constructor(
    public readonly revenueDistributionId: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly productionMonth: string,
    public readonly netRevenue: number,
    public readonly calculatedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Revenue Distribution ${this.revenueDistributionId} recalculated by ${this.calculatedBy} for partner ${this.partnerId} in well ${this.wellId} for ${this.productionMonth} with net revenue $${this.netRevenue.toLocaleString()}`;
  }
}
