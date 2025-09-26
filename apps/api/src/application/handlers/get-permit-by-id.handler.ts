import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { PermitRepository } from '../../domain/repositories/permit.repository';
import { Permit } from '../../domain/entities/permit.entity';
import { GetPermitByIdQuery } from '../queries/get-permit-by-id.query';

/**
 * Query handler for getting a permit by ID
 * Implements CQRS query handling pattern
 */
@QueryHandler(GetPermitByIdQuery)
export class GetPermitByIdHandler implements IQueryHandler<GetPermitByIdQuery> {
  constructor(
    @Inject('PermitRepository')
    private readonly permitRepository: PermitRepository,
  ) {}

  async execute(query: GetPermitByIdQuery): Promise<Permit | null> {
    return this.permitRepository.findById(query.permitId);
  }
}
