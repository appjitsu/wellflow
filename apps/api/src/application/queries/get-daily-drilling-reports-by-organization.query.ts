export class GetDailyDrillingReportsByOrganizationQuery {
  constructor(
    public readonly organizationId: string,
    public readonly options?: {
      limit?: number;
      offset?: number;
      wellId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {}
}
