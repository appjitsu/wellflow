export class DailyDrillingReport {
  constructor(
    private props: {
      id: string;
      organizationId: string;
      wellId: string;
      reportDate: Date;
      depthMd?: number;
      depthTvd?: number;
      rotatingHours?: number;
      nptHours?: number;
      dayCost?: number;
      nextOperations?: string;
      notes?: string;
    },
  ) {}
  getId() {
    return this.props.id;
  }
  getOrganizationId() {
    return this.props.organizationId;
  }
  getWellId() {
    return this.props.wellId;
  }
  getReportDate() {
    return this.props.reportDate;
  }
}
