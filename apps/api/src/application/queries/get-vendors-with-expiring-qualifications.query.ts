import { IQuery } from '@nestjs/cqrs';

/**
 * Get Vendors with Expiring Qualifications Query
 * Query to retrieve vendors with expiring insurance or certifications
 */
export class GetVendorsWithExpiringQualificationsQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly daysUntilExpiration: number = 30,
  ) {}
}
