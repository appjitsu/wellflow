import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetWellsByOperatorQuery } from '../queries/get-wells-by-operator.query';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { WellDto } from '../dtos/well.dto';

/**
 * Get Wells By Operator Query Handler
 * Handles retrieving wells by operator with pagination
 */
@QueryHandler(GetWellsByOperatorQuery)
export class GetWellsByOperatorHandler
  implements IQueryHandler<GetWellsByOperatorQuery>
{
  constructor(
    @Inject('WellRepository')
    private readonly wellRepository: WellRepository,
  ) {}

  async execute(query: GetWellsByOperatorQuery): Promise<{
    wells: WellDto[];
    total: number;
  }> {
    const offset = (query.page - 1) * query.limit;

    const result = await this.wellRepository.findWithPagination(
      offset,
      query.limit,
      {
        operatorId: query.operatorId,
        status: query.filters?.status,
        wellType: query.filters?.wellType,
      },
    );

    return {
      wells: result.wells.map((well) => WellDto.fromEntity(well)),
      total: result.total,
    };
  }
}
