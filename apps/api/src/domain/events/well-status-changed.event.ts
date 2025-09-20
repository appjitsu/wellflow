import { WellStatus } from '../enums/well-status.enum';

/**
 * Well Status Changed Domain Event
 * Raised when a well's status changes
 */
export class WellStatusChangedEvent {
  public readonly eventType = 'WellStatusChanged';
  public readonly occurredAt: Date;

  constructor(
    public readonly wellId: string,
    public readonly apiNumber: string,
    public readonly previousStatus: WellStatus,
    public readonly newStatus: WellStatus,
    public readonly updatedBy: string,
    public readonly metadata?: Record<string, any>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Well ${this.apiNumber} status changed from ${this.previousStatus} to ${this.newStatus} by ${this.updatedBy}`;
  }
}
