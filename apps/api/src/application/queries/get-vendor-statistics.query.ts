import { IQuery } from '@nestjs/cqrs';

/**
 * Get Vendor Statistics Query
 * Query to retrieve vendor statistics for dashboard display
 */
export class GetVendorStatisticsQuery implements IQuery {
  constructor(public readonly organizationId: string) {}
}
