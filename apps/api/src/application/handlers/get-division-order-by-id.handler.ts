import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { GetDivisionOrderByIdQuery } from '../queries/get-division-order-by-id.query';
import { DivisionOrderDto } from '../dtos/division-order.dto';
import type { IDivisionOrderRepository } from '../../domain/repositories/division-order.repository.interface';

/**
 * Get Division Order By ID Query Handler
 * Handles retrieving a division order by its ID
 */
@QueryHandler(GetDivisionOrderByIdQuery)
export class GetDivisionOrderByIdHandler
  implements IQueryHandler<GetDivisionOrderByIdQuery>
{
  constructor(
    @Inject('DivisionOrderRepository')
    private readonly divisionOrderRepository: IDivisionOrderRepository,
  ) {}

  async execute(query: GetDivisionOrderByIdQuery): Promise<DivisionOrderDto> {
    const divisionOrder = await this.divisionOrderRepository.findById(
      query.divisionOrderId,
    );

    if (!divisionOrder) {
      throw new NotFoundException(
        `Division order with ID ${query.divisionOrderId} not found`,
      );
    }

    return DivisionOrderDto.fromEntity(divisionOrder);
  }
}
