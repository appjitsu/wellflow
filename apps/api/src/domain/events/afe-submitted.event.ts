import { AfeType } from '../enums/afe-status.enum';

/**
 * AFE Submitted Domain Event
 * Raised when an AFE is submitted for approval
 */
export class AfeSubmittedEvent {
  public readonly eventType = 'AfeSubmitted';
  public readonly occurredAt: Date;

  constructor(
    public readonly afeId: string,
    public readonly organizationId: string,
    public readonly afeNumber: string,
    public readonly afeType: AfeType,
    public readonly estimatedCost?: number,
    public readonly submittedBy?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `AFE ${this.afeNumber} (${this.afeType}) submitted for approval by ${this.submittedBy}`;
  }
}
