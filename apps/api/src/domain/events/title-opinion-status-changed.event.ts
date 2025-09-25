import { TitleStatus } from '../entities/title-opinion.entity';

/**
 * Title Opinion Status Changed Domain Event
 * Raised when a title opinion's status changes
 */
export class TitleOpinionStatusChangedEvent {
  public readonly eventType = 'TitleOpinionStatusChanged';
  public readonly occurredAt: Date;

  constructor(
    public readonly titleOpinionId: string,
    public readonly previousStatus: TitleStatus,
    public readonly newStatus: TitleStatus,
    public readonly updatedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Title opinion ${this.titleOpinionId} status changed from ${this.previousStatus} to ${this.newStatus} by ${this.updatedBy}`;
  }
}
