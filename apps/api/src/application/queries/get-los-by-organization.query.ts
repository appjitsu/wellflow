import { IQuery } from '@nestjs/cqrs';
import { LosStatus } from '../../domain/enums/los-status.enum';

/**
 * Get LOS by Organization Query
 * Query to retrieve all Lease Operating Statements for an organization
 */
export class GetLosByOrganizationQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly status?: LosStatus,
    public readonly limit?: number,
    public readonly offset?: number,
  ) {}
}
