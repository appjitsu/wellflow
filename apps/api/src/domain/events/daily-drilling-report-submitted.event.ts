export class DailyDrillingReportSubmittedEvent {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly submittedAt: string,
  ) {}
}
