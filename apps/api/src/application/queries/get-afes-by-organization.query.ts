import { IQuery } from '@nestjs/cqrs';
import { AfeStatus, AfeType } from '../../domain/enums/afe-status.enum';

/**
 * Get AFEs By Organization Query
 * Query to retrieve AFEs for an organization with filtering and pagination
 */
export class GetAfesByOrganizationQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: {
      status?: AfeStatus;
      afeType?: AfeType;
      wellId?: string;
      leaseId?: string;
    },
  ) {}
}
