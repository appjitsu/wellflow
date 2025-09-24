import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetDivisionOrdersByOrganizationQuery } from '../queries/get-division-orders-by-organization.query';
import { DivisionOrderDto } from '../dtos/division-order.dto';
import type { IDivisionOrderRepository } from '../../domain/repositories/division-order.repository.interface';

/**
 * Get Division Orders By Organization Query Handler
 * Handles retrieving division orders for an organization with filtering and pagination
 */
@QueryHandler(GetDivisionOrdersByOrganizationQuery)
export class GetDivisionOrdersByOrganizationHandler
  implements IQueryHandler<GetDivisionOrdersByOrganizationQuery>
{
  constructor(
    @Inject('DivisionOrderRepository')
    private readonly divisionOrderRepository: IDivisionOrderRepository,
  ) {}

  async execute(query: GetDivisionOrdersByOrganizationQuery): Promise<{
    divisionOrders: DivisionOrderDto[];
    total: number;
  }> {
    const offset = (query.page - 1) * query.limit;

    // Get division orders with filters
    const divisionOrders =
      await this.divisionOrderRepository.findByOrganizationId(
        query.organizationId,
        {
          limit: query.limit,
          offset,
          isActive: query.filters?.isActive,
        },
      );

    // Get total count for pagination
    const total = await this.divisionOrderRepository.count({
      organizationId: query.organizationId,
      wellId: query.filters?.wellId,
      partnerId: query.filters?.partnerId,
      isActive: query.filters?.isActive,
      effectiveDateFrom: query.filters?.effectiveDateFrom,
      effectiveDateTo: query.filters?.effectiveDateTo,
    });

    return {
      divisionOrders: divisionOrders.map((divisionOrder) =>
        DivisionOrderDto.fromEntity(divisionOrder),
      ),
      total,
    };
  }
}
