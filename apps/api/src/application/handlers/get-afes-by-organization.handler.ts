import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAfesByOrganizationQuery } from '../queries/get-afes-by-organization.query';
import type { IAfeRepository } from '../../domain/repositories/afe.repository.interface';
import { AfeDto } from '../dtos/afe.dto';

/**
 * Get AFEs By Organization Query Handler
 * Handles retrieving AFEs for an organization with filtering and pagination
 */
@QueryHandler(GetAfesByOrganizationQuery)
export class GetAfesByOrganizationHandler
  implements IQueryHandler<GetAfesByOrganizationQuery>
{
  constructor(
    @Inject('AfeRepository')
    private readonly afeRepository: IAfeRepository,
  ) {}

  async execute(query: GetAfesByOrganizationQuery): Promise<{
    afes: AfeDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (query.page - 1) * query.limit;

    // Get AFEs with pagination and filters
    const afes = await this.afeRepository.findByOrganizationId(
      query.organizationId,
      {
        limit: query.limit,
        offset,
        status: query.filters?.status,
        afeType: query.filters?.afeType,
      },
    );

    // Get total count for pagination
    const total = await this.afeRepository.count(query.organizationId, {
      status: query.filters?.status,
      afeType: query.filters?.afeType,
      wellId: query.filters?.wellId,
      leaseId: query.filters?.leaseId,
    });

    return {
      afes: AfeDto.fromEntities(afes),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
