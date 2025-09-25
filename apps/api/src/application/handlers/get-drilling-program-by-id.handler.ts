import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetDrillingProgramByIdQuery } from '../queries/get-drilling-program-by-id.query';
import type { IDrillingProgramRepository } from '../../domain/repositories/drilling-program.repository.interface';
import { DrillingProgramDto } from '../dtos/drilling-program.dto';

@QueryHandler(GetDrillingProgramByIdQuery)
export class GetDrillingProgramByIdHandler
  implements IQueryHandler<GetDrillingProgramByIdQuery>
{
  constructor(
    @Inject('DrillingProgramRepository')
    private readonly repo: IDrillingProgramRepository,
  ) {}

  async execute(
    query: GetDrillingProgramByIdQuery,
  ): Promise<DrillingProgramDto> {
    const program = await this.repo.findById(query.id);
    if (!program)
      throw new NotFoundException(`DrillingProgram ${query.id} not found`);

    return {
      id: program.getId(),
      organizationId: program.getOrganizationId(),
      wellId: program.getWellId(),
      afeId: program.getAfeId() ?? null,
      programName: program.getProgramName(),
      version: program.getVersion(),
      status: program.getStatus(),
      program: program.getProgram() ?? null,
      hazards: program.getHazards() ?? null,
      approvals: program.getApprovals() ?? null,
      estimatedCost: program.getEstimatedCost() ?? null,
      actualCost: program.getActualCost() ?? null,
      createdAt: program.getCreatedAt(),
      updatedAt: program.getUpdatedAt(),
    };
  }
}
