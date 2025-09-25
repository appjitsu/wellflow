import { Jurisdiction } from '../value-objects/jurisdiction.vo';
import { Period } from '../value-objects/period.vo';

export type ReportType = 'PR' | 'C115' | 'FORM7' | 'OGOR' | 'SUBPART_W';

export class RegulatoryReportInstance {
  constructor(
    private readonly id: string,
    private readonly organizationId: string,
    private readonly jurisdiction: Jurisdiction,
    private readonly reportType: ReportType,
    private readonly period: Period,
    private readonly status: 'draft' | 'validated' | 'submitted' = 'draft',
    private readonly createdByUserId?: string,
  ) {}

  getId(): string {
    return this.id;
  }
  getOrganizationId(): string {
    return this.organizationId;
  }
  getJurisdiction(): Jurisdiction {
    return this.jurisdiction;
  }
  getReportType(): ReportType {
    return this.reportType;
  }
  getPeriod(): Period {
    return this.period;
  }
  getStatus(): 'draft' | 'validated' | 'submitted' {
    return this.status;
  }
  getCreatedByUserId(): string {
    return this.createdByUserId as string;
  }
}
