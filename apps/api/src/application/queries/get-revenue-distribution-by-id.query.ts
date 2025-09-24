import { IQuery } from '@nestjs/cqrs';

/**
 * Get Revenue Distribution By ID Query
 * Query to retrieve a revenue distribution by its ID
 */
export class GetRevenueDistributionByIdQuery implements IQuery {
  constructor(public readonly revenueDistributionId: string) {}
}
