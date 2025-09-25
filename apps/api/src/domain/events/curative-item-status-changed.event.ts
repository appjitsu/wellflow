import { CurativeStatus } from '../entities/curative-item.entity';

/**
 * Curative Item Status Changed Domain Event
 * Raised when a curative item's status changes
 */
export class CurativeItemStatusChangedEvent {
  public readonly eventType = 'CurativeItemStatusChanged';
  public readonly occurredAt: Date;

  constructor(
    public readonly curativeItemId: string,
    public readonly previousStatus: CurativeStatus,
    public readonly newStatus: CurativeStatus,
    public readonly updatedBy: string,
    public readonly resolutionNotes?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Curative item ${this.curativeItemId} status changed from ${this.previousStatus} to ${this.newStatus} by ${this.updatedBy}`;
  }
}
