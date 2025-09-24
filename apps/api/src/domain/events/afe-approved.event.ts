/**
 * AFE Approved Domain Event
 * Raised when an AFE is approved
 */
export class AfeApprovedEvent {
  public readonly eventType = 'AfeApproved';
  public readonly occurredAt: Date;

  constructor(
    public readonly afeId: string,
    public readonly organizationId: string,
    public readonly afeNumber: string,
    public readonly approvedAmount?: number,
    public readonly approvedBy?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const amountText = this.approvedAmount
      ? ` for $${this.approvedAmount.toLocaleString()}`
      : '';
    return `AFE ${this.afeNumber} approved${amountText} by ${this.approvedBy}`;
  }
}
