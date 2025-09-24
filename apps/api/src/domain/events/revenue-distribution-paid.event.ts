/**
 * Revenue Distribution Paid Domain Event
 * Raised when a revenue distribution payment is processed
 */
export class RevenueDistributionPaidEvent {
  public readonly eventType = 'RevenueDistributionPaid';
  public readonly occurredAt: Date;

  constructor(
    public readonly revenueDistributionId: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly productionMonth: string,
    public readonly netRevenue: number,
    public readonly checkNumber: string,
    public readonly paymentDate: Date,
    public readonly processedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Revenue Distribution ${this.revenueDistributionId} paid to partner ${this.partnerId} for ${this.productionMonth} with check ${this.checkNumber} on ${this.paymentDate.toISOString().split('T')[0]} - Amount: $${this.netRevenue.toLocaleString()}`;
  }
}
