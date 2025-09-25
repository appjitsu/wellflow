/**
 * Curative Item Assigned Domain Event
 * Raised when a curative item is assigned to a user
 */
export class CurativeItemAssignedEvent {
  public readonly eventType = 'CurativeItemAssigned';
  public readonly occurredAt: Date;

  constructor(
    public readonly curativeItemId: string,
    public readonly newAssignee: string,
    public readonly updatedBy: string,
    public readonly previousAssignee?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    const prev = this.previousAssignee ? ` from ${this.previousAssignee}` : '';
    return `Curative item ${this.curativeItemId} assigned to ${this.newAssignee}${prev} by ${this.updatedBy}`;
  }
}
