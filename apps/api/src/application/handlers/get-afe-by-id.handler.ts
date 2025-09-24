import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetAfeByIdQuery } from '../queries/get-afe-by-id.query';
import type { IAfeRepository } from '../../domain/repositories/afe.repository.interface';
import { AfeDto } from '../dtos/afe.dto';

/**
 * Get AFE By ID Query Handler
 * Handles retrieving an AFE by its ID
 */
@QueryHandler(GetAfeByIdQuery)
export class GetAfeByIdHandler implements IQueryHandler<GetAfeByIdQuery> {
  constructor(
    @Inject('AfeRepository')
    private readonly afeRepository: IAfeRepository,
  ) {}

  async execute(query: GetAfeByIdQuery): Promise<AfeDto> {
    const afe = await this.afeRepository.findById(query.afeId);

    if (!afe) {
      throw new NotFoundException(`AFE with ID ${query.afeId} not found`);
    }

    return AfeDto.fromEntity(afe);
  }
}
