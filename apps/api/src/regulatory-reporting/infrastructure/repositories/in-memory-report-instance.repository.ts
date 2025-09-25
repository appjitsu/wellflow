import { Injectable } from '@nestjs/common';
import { ReportInstanceRepository } from '../../../regulatory-reporting/domain/repositories/report-instance.repository';
import { RegulatoryReportInstance } from '../../../regulatory-reporting/domain/entities/regulatory-report-instance.entity';
import type { RegulatoryReportFormData } from '../../../regulatory-reporting/domain/value-objects/regulatory-report-form-data';

@Injectable()
export class InMemoryReportInstanceRepository
  implements ReportInstanceRepository
{
  private store = new Map<string, RegulatoryReportInstance>();
  private formData = new Map<string, RegulatoryReportFormData>();

  save(instance: RegulatoryReportInstance): Promise<RegulatoryReportInstance> {
    this.store.set(instance.getId(), instance);
    return Promise.resolve(instance);
  }

  findById(id: string): Promise<RegulatoryReportInstance | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  updateFormData(
    id: string,
    formDataPatch: Partial<RegulatoryReportFormData>,
  ): Promise<void> {
    const current = this.formData.get(id) ?? ({} as RegulatoryReportFormData);
    const merged: RegulatoryReportFormData = {
      ...structuredClone(current),
      ...formDataPatch,
    };
    this.formData.set(id, merged);
    return Promise.resolve();
  }
  getFormData(id: string): Promise<RegulatoryReportFormData | null> {
    const data = this.formData.get(id);
    return Promise.resolve(data ? structuredClone(data) : null);
  }
}
