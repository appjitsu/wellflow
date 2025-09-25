export class DailyDrillingReportCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly reportDate: string,
  ) {}
}
