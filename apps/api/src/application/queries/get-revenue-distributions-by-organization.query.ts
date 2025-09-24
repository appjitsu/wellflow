import { IQuery } from '@nestjs/cqrs';

/**
 * Get Revenue Distributions By Organization Query
 * Query to retrieve revenue distributions for an organization with filtering and pagination
 */
export class GetRevenueDistributionsByOrganizationQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: {
      wellId?: string;
      partnerId?: string;
      productionMonth?: string; // YYYY-MM format
      startMonth?: string; // YYYY-MM format
      endMonth?: string; // YYYY-MM format
      isPaid?: boolean;
    },
  ) {}
}
