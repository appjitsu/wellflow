import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetWellByIdQuery } from '../queries/get-well-by-id.query';
import type { WellRepository } from '../../domain/repositories/well.repository.interface';
import { WellDto } from '../dtos/well.dto';

/**
 * Get Well By ID Query Handler
 * Handles retrieving a well by its ID
 */
@QueryHandler(GetWellByIdQuery)
export class GetWellByIdHandler implements IQueryHandler<GetWellByIdQuery> {
  constructor(
    @Inject('WellRepository')
    private readonly wellRepository: WellRepository,
  ) {}

  async execute(query: GetWellByIdQuery): Promise<WellDto> {
    const well = await this.wellRepository.findById(query.wellId);

    if (!well) {
      throw new NotFoundException(`Well with ID ${query.wellId} not found`);
    }

    return WellDto.fromEntity(well);
  }
}
