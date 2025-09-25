import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetDailyDrillingReportByIdQuery } from '../queries/get-daily-drilling-report-by-id.query';
import type { IDailyDrillingReportRepository } from '../../domain/repositories/daily-drilling-report.repository.interface';

@QueryHandler(GetDailyDrillingReportByIdQuery)
export class GetDailyDrillingReportByIdHandler
  implements IQueryHandler<GetDailyDrillingReportByIdQuery>
{
  constructor(
    @Inject('DailyDrillingReportRepository')
    private readonly repo: IDailyDrillingReportRepository,
  ) {}
  async execute(query: GetDailyDrillingReportByIdQuery) {
    const found = await this.repo.findById(query.id);
    if (!found) return null;
    return {
      id: found.getId(),
      organizationId: found.getOrganizationId(),
      wellId: found.getWellId(),
      reportDate: found.getReportDate().toISOString().split('T')[0],
    };
  }
}
