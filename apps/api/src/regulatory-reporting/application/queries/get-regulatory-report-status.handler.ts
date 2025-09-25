import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ReportInstanceRepository } from '../../domain/repositories/report-instance.repository';
import { GetRegulatoryReportStatusQuery } from './get-regulatory-report-status.query';

@QueryHandler(GetRegulatoryReportStatusQuery)
export class GetRegulatoryReportStatusHandler
  implements IQueryHandler<GetRegulatoryReportStatusQuery>
{
  constructor(
    @Inject('ReportInstanceRepository')
    private readonly repo: ReportInstanceRepository,
  ) {}

  async execute(
    query: GetRegulatoryReportStatusQuery,
  ): Promise<{ status: string }> {
    const instance = await this.repo.findById(query.reportId);
    if (!instance) {
      throw new NotFoundException('Regulatory report instance not found');
    }

    return { status: instance.getStatus() };
  }
}
