import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetLosByIdQuery } from '../queries/get-los-by-id.query';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';
import { LosDto } from '../dtos/los.dto';

/**
 * Get LOS by ID Query Handler
 * Handles retrieving a specific Lease Operating Statement by ID
 */
@QueryHandler(GetLosByIdQuery)
export class GetLosByIdHandler implements IQueryHandler<GetLosByIdQuery> {
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
  ) {}

  async execute(query: GetLosByIdQuery): Promise<LosDto> {
    const los = await this.losRepository.findById(query.losId);

    if (!los) {
      throw new NotFoundException(
        `Lease Operating Statement with ID ${query.losId} not found`,
      );
    }

    return LosDto.fromDomain(los);
  }
}
