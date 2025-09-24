import { IQuery } from '@nestjs/cqrs';
import { LosStatus } from '../../domain/enums/los-status.enum';

/**
 * Get LOS by Lease Query
 * Query to retrieve all Lease Operating Statements for a specific lease
 */
export class GetLosByLeaseQuery implements IQuery {
  constructor(
    public readonly leaseId: string,
    public readonly status?: LosStatus,
    public readonly limit?: number,
    public readonly offset?: number,
  ) {}
}
