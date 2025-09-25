/**
 * Curative Item Due Date Changed Domain Event
 * Raised when a curative item's due date is changed
 */
export class CurativeItemDueDateChangedEvent {
  public readonly eventType = 'CurativeItemDueDateChanged';
  public readonly occurredAt: Date;

  constructor(
    public readonly curativeItemId: string,
    public readonly updatedBy: string,
    public readonly previousDueDate?: Date,
    public readonly newDueDate?: Date,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const prev = this.previousDueDate
      ? this.previousDueDate.toISOString().split('T')[0]
      : 'none';
    const next = this.newDueDate
      ? this.newDueDate.toISOString().split('T')[0]
      : 'none';
    return `Curative item ${this.curativeItemId} due date changed from ${prev} to ${next} by ${this.updatedBy}`;
  }
}
