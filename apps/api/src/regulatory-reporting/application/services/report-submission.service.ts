import { Inject, Injectable } from '@nestjs/common';
import { SubmissionReceipt } from '../../infrastructure/adapters/regulator-adapter.interface';
import type { ReportInstanceRepository } from '../../domain/repositories/report-instance.repository';
import { AdapterRegistryService } from './adapter-registry.service';
import { CircuitBreaker } from '../../../common/resilience/circuit-breaker';
import { Buffer } from 'buffer';

@Injectable()
export class ReportSubmissionService {
  constructor(
    @Inject('ReportInstanceRepository')
    private readonly repo: ReportInstanceRepository,
    private readonly registry: AdapterRegistryService,
    private readonly breaker: CircuitBreaker,
  ) {}

  async submit(
    reportId: string,
    opts?: { amendmentType?: 'ORIGINAL' | 'CORRECTED' | 'AMENDED' },
  ): Promise<SubmissionReceipt> {
    const instance = await this.repo.findById(reportId);
    if (!instance) throw new Error('Report instance not found');

    const adapter = this.registry.resolve(instance);
    const file = await adapter.buildFile(instance);

    // Persist export artifact (base64) with minimal metadata for future UI download
    const base64 = Buffer.from(file).toString('base64');
    await this.repo.updateFormData(reportId, {
      txPrExport: {
        period: instance.getPeriod().toString(),
        bytesBase64: base64,
        length: file.length,
        generatedAtUtc: new Date().toISOString(),
        amendmentType: opts?.amendmentType ?? 'ORIGINAL',
      },
    });

    return await this.breaker.execute(async () => adapter.submit(file));
  }
}
