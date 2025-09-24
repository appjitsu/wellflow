import { IQuery } from '@nestjs/cqrs';

/**
 * Get Revenue Distributions By Well Query
 * Query to retrieve revenue distributions for a specific well
 */
export class GetRevenueDistributionsByWellQuery implements IQuery {
  constructor(
    public readonly wellId: string,
    public readonly productionMonth?: string, // YYYY-MM format
    public readonly startMonth?: string, // YYYY-MM format
    public readonly endMonth?: string, // YYYY-MM format
  ) {}
}
