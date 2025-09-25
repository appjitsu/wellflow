export class DrillingProgramCreatedEvent {
  public readonly occurredAt: Date;
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly programName: string,
  ) {
    this.occurredAt = new Date();
  }
}
