import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetDrillingProgramsByOrganizationQuery } from '../queries/get-drilling-programs-by-organization.query';
import type { IDrillingProgramRepository } from '../../domain/repositories/drilling-program.repository.interface';
import { DrillingProgramDto } from '../dtos/drilling-program.dto';

@QueryHandler(GetDrillingProgramsByOrganizationQuery)
export class GetDrillingProgramsByOrganizationHandler
  implements IQueryHandler<GetDrillingProgramsByOrganizationQuery>
{
  constructor(
    @Inject('DrillingProgramRepository')
    private readonly repo: IDrillingProgramRepository,
  ) {}

  async execute(query: GetDrillingProgramsByOrganizationQuery): Promise<{
    programs: DrillingProgramDto[];
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

    const programs: DrillingProgramDto[] = rows.map((p) => ({
      id: p.getId(),
      organizationId: p.getOrganizationId(),
      wellId: p.getWellId(),
      afeId: p.getAfeId() ?? null,
      programName: p.getProgramName(),
      version: p.getVersion(),
      status: p.getStatus(),
      program: p.getProgram() ?? null,
      hazards: p.getHazards() ?? null,
      approvals: p.getApprovals() ?? null,
      estimatedCost: p.getEstimatedCost() ?? null,
      actualCost: p.getActualCost() ?? null,
      createdAt: p.getCreatedAt(),
      updatedAt: p.getUpdatedAt(),
    }));

    // No count method yet; return page data with current slice size.
    return {
      programs,
      total: programs.length,
      page: query.page,
      limit: query.limit,
    };
  }
}
