import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetLosByLeaseQuery } from '../queries/get-los-by-lease.query';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';
import { LosListItemDto } from '../dtos/los.dto';

/**
 * Get LOS by Lease Query Handler
 * Handles retrieving all Lease Operating Statements for a specific lease
 */
@QueryHandler(GetLosByLeaseQuery)
export class GetLosByLeaseHandler implements IQueryHandler<GetLosByLeaseQuery> {
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
  ) {}

  async execute(query: GetLosByLeaseQuery): Promise<LosListItemDto[]> {
    const losStatements = await this.losRepository.findByLeaseId(
      query.leaseId,
      {
        status: query.status,
        limit: query.limit,
        offset: query.offset,
      },
    );

    return losStatements.map((los) => LosListItemDto.fromDomain(los));
  }
}
