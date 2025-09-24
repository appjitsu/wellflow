/**
 * AFE Rejected Domain Event
 * Raised when an AFE is rejected
 */
export class AfeRejectedEvent {
  public readonly eventType = 'AfeRejected';
  public readonly occurredAt: Date;

  constructor(
    public readonly afeId: string,
    public readonly organizationId: string,
    public readonly afeNumber: string,
    public readonly rejectedBy?: string,
    public readonly reason?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const reasonText = this.reason ? ` (${this.reason})` : '';
    return `AFE ${this.afeNumber} rejected by ${this.rejectedBy}${reasonText}`;
  }
}
