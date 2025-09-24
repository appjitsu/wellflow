import { IQuery } from '@nestjs/cqrs';

/**
 * Get Unpaid Revenue Distributions Query
 * Query to retrieve unpaid revenue distributions for an organization
 */
export class GetUnpaidRevenueDistributionsQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly wellId?: string,
    public readonly partnerId?: string,
    public readonly beforeMonth?: string, // YYYY-MM format
    public readonly minimumAmount?: number,
  ) {}
}
