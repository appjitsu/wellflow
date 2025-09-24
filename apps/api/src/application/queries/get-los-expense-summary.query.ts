import { IQuery } from '@nestjs/cqrs';

/**
 * Get LOS Expense Summary Query
 * Query to retrieve expense summary across leases for a date range
 */
export class GetLosExpenseSummaryQuery implements IQuery {
  constructor(
    public readonly organizationId: string,
    public readonly startYear: number,
    public readonly startMonth: number,
    public readonly endYear: number,
    public readonly endMonth: number,
  ) {}
}
