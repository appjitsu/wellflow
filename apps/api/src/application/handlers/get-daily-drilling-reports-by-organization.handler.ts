import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetDailyDrillingReportsByOrganizationQuery } from '../queries/get-daily-drilling-reports-by-organization.query';
import type { IDailyDrillingReportRepository } from '../../domain/repositories/daily-drilling-report.repository.interface';

@QueryHandler(GetDailyDrillingReportsByOrganizationQuery)
export class GetDailyDrillingReportsByOrganizationHandler
  implements IQueryHandler<GetDailyDrillingReportsByOrganizationQuery>
{
  constructor(
    @Inject('DailyDrillingReportRepository')
    private readonly repo: IDailyDrillingReportRepository,
  ) {}
  async execute(q: GetDailyDrillingReportsByOrganizationQuery) {
    const items = await this.repo.findByOrganizationId(q.organizationId, {
      limit: q.options?.limit,
      offset: q.options?.offset,
      wellId: q.options?.wellId,
      fromDate: q.options?.fromDate ? new Date(q.options.fromDate) : undefined,
      toDate: q.options?.toDate ? new Date(q.options.toDate) : undefined,
    });
    return items.map((r) => ({
      id: r.getId(),
      organizationId: r.getOrganizationId(),
      wellId: r.getWellId(),
      reportDate: r.getReportDate().toISOString().split('T')[0],
    }));
  }
}
