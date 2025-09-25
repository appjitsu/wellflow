import { Injectable } from '@nestjs/common';
import {
  RegulatorAdapter,
  SubmissionReceipt,
} from './regulator-adapter.interface';
import { RegulatoryReportInstance } from '../../domain/entities/regulatory-report-instance.entity';

@Injectable()
export class CoCogccForm7Adapter implements RegulatorAdapter {
  buildFile(instance: RegulatoryReportInstance): Promise<Uint8Array> {
    const payload = {
      reportId: instance.getId(),
      organizationId: instance.getOrganizationId(),
      period: instance.getPeriod().toString(),
      generatedAtUtc: new Date().toISOString(),
      status: instance.getStatus(),
    };

    const encoder = new TextEncoder();
    return Promise.resolve(encoder.encode(JSON.stringify(payload)));
  }

  submit(_file: Uint8Array): Promise<SubmissionReceipt> {
    return Promise.resolve({
      submissionId: 'co-cogcc-form7-simulated',
      accepted: true,
      message: 'Submission captured locally for operator processing.',
    });
  }
}
