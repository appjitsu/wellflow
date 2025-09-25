import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { complianceReports } from '../../../database/schemas/compliance-reports';
import { RegulatoryReportInstance } from '../../domain/entities/regulatory-report-instance.entity';
import { ReportInstanceRepository } from '../../domain/repositories/report-instance.repository';
import { Period } from '../../domain/value-objects/period.vo';
import { Jurisdiction } from '../../domain/value-objects/jurisdiction.vo';
import type { RegulatoryReportFormData } from '../../domain/value-objects/regulatory-report-form-data';

@Injectable()
export class DrizzleReportInstanceRepository
  implements ReportInstanceRepository
{
  constructor(
    @Inject('DATABASE_CONNECTION')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly db: NodePgDatabase<any>,
  ) {}

  async save(
    instance: RegulatoryReportInstance,
  ): Promise<RegulatoryReportInstance> {
    const period = instance.getPeriod().toString();
    const periodParts = period.split('-').map((v) => Number(v));
    if (periodParts.length !== 2 || periodParts.some(isNaN)) {
      throw new Error('Invalid period format');
    }
    const y = periodParts[0] as number;
    const m = periodParts[1] as number;
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 0));
    const dueDate = new Date(Date.UTC(y, m, 15)); // 15th of following month (UTC)

    const values: typeof complianceReports.$inferInsert = {
      id: instance.getId(),
      organizationId: instance.getOrganizationId(),
      createdByUserId: instance.getCreatedByUserId(),
      reportType: mapReportType(instance.getReportType()),
      stateJurisdiction: instance.getJurisdiction(),
      reportingPeriodStart: start.toISOString(),
      reportingPeriodEnd: end.toISOString(),
      dueDate: dueDate.toISOString(),
      status: instance.getStatus(),
      formData: null,
      calculatedValues: null,
    } as const;

    await this.db
      .insert(complianceReports)
      .values(values)
      .onConflictDoUpdate({
        target: complianceReports.id,
        set: { ...values, updatedAt: new Date() },
      });

    return instance;
  }

  async findById(id: string): Promise<RegulatoryReportInstance | null> {
    const [row] = await this.db
      .select()
      .from(complianceReports)
      .where(eq(complianceReports.id, id))
      .limit(1);

    if (!row) return null;

    return new RegulatoryReportInstance(
      row.id,
      row.organizationId,
      row.stateJurisdiction as Jurisdiction,
      mapReportTypeBack(row.reportType),
      new Period(toPeriodString(new Date(row.reportingPeriodStart))),
      row.status as 'draft' | 'validated' | 'submitted',
      row.createdByUserId,
    );
  }
  async updateFormData(
    id: string,
    formDataPatch: Partial<RegulatoryReportFormData>,
  ): Promise<void> {
    const [row] = await this.db
      .select({
        id: complianceReports.id,
        formData: complianceReports.formData,
      })
      .from(complianceReports)
      .where(eq(complianceReports.id, id))
      .limit(1);
    const current =
      row?.formData && typeof row.formData === 'object'
        ? (structuredClone(row.formData) as RegulatoryReportFormData)
        : {};
    const merged: RegulatoryReportFormData = {
      ...current,
      ...formDataPatch,
    };
    await this.db
      .update(complianceReports)
      .set({ formData: merged, updatedAt: new Date() })
      .where(eq(complianceReports.id, id));
  }
  async getFormData(id: string): Promise<RegulatoryReportFormData | null> {
    const [row] = await this.db
      .select({ formData: complianceReports.formData })
      .from(complianceReports)
      .where(eq(complianceReports.id, id))
      .limit(1);
    if (!row?.formData || typeof row.formData !== 'object') {
      return null;
    }
    return structuredClone(row.formData) as RegulatoryReportFormData;
  }
}

function toPeriodString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  return `${y}-${m}`;
}

function mapReportType(
  rt: 'PR' | 'C115' | 'FORM7' | 'OGOR' | 'SUBPART_W',
): string {
  switch (rt) {
    case 'PR':
      return 'form_pr';
    case 'C115':
      return 'c115';
    case 'FORM7':
      return 'form7';
    case 'OGOR':
      return 'ogor';
    case 'SUBPART_W':
      return 'subpart_w';
  }
}

function mapReportTypeBack(
  rt: string,
): 'PR' | 'C115' | 'FORM7' | 'OGOR' | 'SUBPART_W' {
  switch (rt) {
    case 'form_pr':
      return 'PR';
    case 'c115':
      return 'C115';
    case 'form7':
      return 'FORM7';
    case 'ogor':
      return 'OGOR';
    case 'subpart_w':
      return 'SUBPART_W';
    default:
      return 'PR';
  }
}
