import { Injectable } from '@nestjs/common';
import {
  RegulatorAdapter,
  SubmissionReceipt,
} from './regulator-adapter.interface';
import { RegulatoryReportInstance } from '../../domain/entities/regulatory-report-instance.entity';

@Injectable()
export class NmOcdC115Adapter implements RegulatorAdapter {
  buildFile(instance: RegulatoryReportInstance): Promise<Uint8Array> {
    const payloadLines = [
      `REPORT_ID|${instance.getId()}`,
      `ORGANIZATION_ID|${instance.getOrganizationId()}`,
      `PERIOD|${instance.getPeriod().toString()}`,
      `STATUS|${instance.getStatus()}`,
      `GENERATED_UTC|${new Date().toISOString()}`,
    ];
    const encoder = new TextEncoder();
    return Promise.resolve(encoder.encode(payloadLines.join('\n') + '\n'));
  }

  submit(_file: Uint8Array): Promise<SubmissionReceipt> {
    return Promise.resolve({
      submissionId: 'nm-ocd-c115-simulated',
      accepted: true,
      message: 'Submission logged for offline OCD upload.',
    });
  }
}
