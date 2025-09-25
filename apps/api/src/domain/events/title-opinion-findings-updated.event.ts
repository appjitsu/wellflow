/**
 * Title Opinion Findings Updated Domain Event
 * Raised when a title opinion's findings or recommendations are updated
 */
export class TitleOpinionFindingsUpdatedEvent {
  public readonly eventType = 'TitleOpinionFindingsUpdated';
  public readonly occurredAt: Date;

  constructor(
    public readonly titleOpinionId: string,
    public readonly updatedBy: string,
    public readonly previousFindings?: string,
    public readonly newFindings?: string,
    public readonly previousRecommendations?: string,
    public readonly newRecommendations?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Title opinion ${this.titleOpinionId} findings updated by ${this.updatedBy}`;
  }
}
