import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetWorkoverByIdQuery } from '../queries/get-workover-by-id.query';
import type { IWorkoverRepository } from '../../domain/repositories/workover.repository.interface';
import { WorkoverDto } from '../dtos/workover.dto';

@QueryHandler(GetWorkoverByIdQuery)
export class GetWorkoverByIdHandler
  implements IQueryHandler<GetWorkoverByIdQuery>
{
  constructor(
    @Inject('WorkoverRepository') private readonly repo: IWorkoverRepository,
  ) {}

  async execute(query: GetWorkoverByIdQuery): Promise<WorkoverDto> {
    const w = await this.repo.findById(query.id);
    if (!w) throw new NotFoundException(`Workover ${query.id} not found`);

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
  }
}
