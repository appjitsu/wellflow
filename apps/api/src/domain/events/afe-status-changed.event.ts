import { AfeStatus } from '../enums/afe-status.enum';

/**
 * AFE Status Changed Domain Event
 * Raised when an AFE's status changes
 */
export class AfeStatusChangedEvent {
  public readonly eventType = 'AfeStatusChanged';
  public readonly occurredAt: Date;

  constructor(
    public readonly afeId: string,
    public readonly afeNumber: string,
    public readonly previousStatus: AfeStatus,
    public readonly newStatus: AfeStatus,
    public readonly updatedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `AFE ${this.afeNumber} status changed from ${this.previousStatus} to ${this.newStatus} by ${this.updatedBy}`;
  }
}
