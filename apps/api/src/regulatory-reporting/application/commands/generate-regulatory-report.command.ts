export class GenerateRegulatoryReportCommand {
  constructor(
    public readonly organizationId: string,
    public readonly jurisdiction: 'TX' | 'NM' | 'CO',
    public readonly reportType: 'PR' | 'C115' | 'FORM7',
    public readonly period: string,
    public readonly createdByUserId: string,
  ) {}
}
