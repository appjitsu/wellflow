import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetWorkoversByOrganizationQuery } from '../queries/get-workovers-by-organization.query';
import type { IWorkoverRepository } from '../../domain/repositories/workover.repository.interface';
import { WorkoverDto } from '../dtos/workover.dto';

@QueryHandler(GetWorkoversByOrganizationQuery)
export class GetWorkoversByOrganizationHandler
  implements IQueryHandler<GetWorkoversByOrganizationQuery>
{
  constructor(
    @Inject('WorkoverRepository') private readonly repo: IWorkoverRepository,
  ) {}

  async execute(query: GetWorkoversByOrganizationQuery): Promise<{
    workovers: WorkoverDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (query.page - 1) * query.limit;
    const rows = await this.repo.findByOrganizationId(query.organizationId, {
      status: query.filters?.status,
      wellId: query.filters?.wellId,
      limit: query.limit,
      offset,
    });

    const workovers: WorkoverDto[] = rows.map((w) => {
      const startDate = w.getStartDate();
      const endDate = w.getEndDate();

      return {
        id: w.getId(),
        organizationId: w.getOrganizationId(),
        wellId: w.getWellId(),
        afeId: w.getAfeId() ?? null,
        reason: w.getReason() ?? null,
        status: w.getStatus(),
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        estimatedCost: w.getEstimatedCost() ?? null,
        actualCost: w.getActualCost() ?? null,
        preProductionSnapshot: w.getPreProductionSnapshot() ?? null,
        postProductionSnapshot: w.getPostProductionSnapshot() ?? null,
        createdAt: w.getCreatedAt(),
        updatedAt: w.getUpdatedAt(),
      };
    });

    return {
      workovers,
      total: workovers.length,
      page: query.page,
      limit: query.limit,
    };
  }
}
