import { IQuery } from '@nestjs/cqrs';

/**
 * Get Division Orders By Organization Query
 * Query to retrieve division orders for an organization with filtering and pagination
 */
export class GetDivisionOrdersByOrganizationQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: {
      wellId?: string;
      partnerId?: string;
      isActive?: boolean;
      effectiveDateFrom?: Date;
      effectiveDateTo?: Date;
    },
  ) {}
}
