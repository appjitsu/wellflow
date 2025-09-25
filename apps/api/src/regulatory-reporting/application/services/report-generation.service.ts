import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Period } from '../../domain/value-objects/period.vo';
import { Jurisdiction } from '../../domain/value-objects/jurisdiction.vo';
import {
  RegulatoryReportInstance,
  ReportType,
} from '../../domain/entities/regulatory-report-instance.entity';
import type { ReportInstanceRepository } from '../../domain/repositories/report-instance.repository';

@Injectable()
export class ReportGenerationService {
  constructor(
    @Inject('ReportInstanceRepository')
    private readonly repo: ReportInstanceRepository,
  ) {}

  async generate(
    organizationId: string,
    jurisdiction: Jurisdiction,
    reportType: ReportType,
    period: string,
    createdByUserId: string,
  ): Promise<RegulatoryReportInstance> {
    const instance = new RegulatoryReportInstance(
      randomUUID(),
      organizationId,
      jurisdiction,
      reportType,
      new Period(period),
      'draft',
      createdByUserId,
    );
    await this.repo.save(instance);
    return instance;
  }
}
