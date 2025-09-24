import { IQuery } from '@nestjs/cqrs';

/**
 * Get Revenue Summary Query
 * Query to get revenue summary for wells, partners, or organization
 */
export class GetRevenueSummaryQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly summaryType: 'well' | 'partner' | 'monthly' | 'trends',
    public readonly targetId?: string, // wellId or partnerId depending on summaryType
    public readonly startMonth?: string, // YYYY-MM format
    public readonly endMonth?: string, // YYYY-MM format
    public readonly productionMonth?: string, // YYYY-MM format for monthly summary
  ) {}
}
