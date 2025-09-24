import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetLosByOrganizationQuery } from '../queries/get-los-by-organization.query';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';
import { LosListItemDto } from '../dtos/los.dto';

/**
 * Get LOS by Organization Query Handler
 * Handles retrieving all Lease Operating Statements for an organization
 */
@QueryHandler(GetLosByOrganizationQuery)
export class GetLosByOrganizationHandler
  implements IQueryHandler<GetLosByOrganizationQuery>
{
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
  ) {}

  async execute(query: GetLosByOrganizationQuery): Promise<LosListItemDto[]> {
    const losStatements = await this.losRepository.findByOrganizationId(
      query.organizationId,
      {
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      },
    );

    return losStatements.map((los) => LosListItemDto.fromDomain(los));
  }
}
