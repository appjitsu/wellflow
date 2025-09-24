import { IQuery } from '@nestjs/cqrs';

/**
 * Get Division Order By ID Query
 * Query to retrieve a division order by its ID
 */
export class GetDivisionOrderByIdQuery implements IQuery {
  constructor(public readonly divisionOrderId: string) {}
}
