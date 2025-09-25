import { RegulatoryReportInstance } from '../entities/regulatory-report-instance.entity';
import type { RegulatoryReportFormData } from '../value-objects/regulatory-report-form-data';

export interface ReportInstanceRepository {
  save(instance: RegulatoryReportInstance): Promise<RegulatoryReportInstance>;
  findById(id: string): Promise<RegulatoryReportInstance | null>;
  updateFormData(
    id: string,
    formDataPatch: Partial<RegulatoryReportFormData>,
  ): Promise<void>;
  getFormData(id: string): Promise<RegulatoryReportFormData | null>;
}
