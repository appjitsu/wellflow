import { IQuery } from '@nestjs/cqrs';

/**
 * Get Division Orders By Well Query
 * Query to retrieve division orders for a specific well
 */
export class GetDivisionOrdersByWellQuery implements IQuery {
  constructor(
    public readonly wellId: string,
    public readonly isActive?: boolean,
    public readonly effectiveDate?: Date,
  ) {}
}
