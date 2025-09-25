import { RegulatoryReportInstance } from '../../domain/entities/regulatory-report-instance.entity';

export interface SubmissionReceipt {
  submissionId: string;
  accepted: boolean;
  message?: string;
}

export interface RegulatorAdapter {
  buildFile(instance: RegulatoryReportInstance): Promise<Uint8Array>;
  submit(file: Uint8Array): Promise<SubmissionReceipt>;
}
