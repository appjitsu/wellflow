export class WorkoverCreatedEvent {
  public readonly occurredAt: Date;
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly status: string,
  ) {
    this.occurredAt = new Date();
  }
}
