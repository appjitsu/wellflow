import { IQuery } from '@nestjs/cqrs';

/**
 * Get Decimal Interest Summary Query
 * Query to get decimal interest summary for a well
 */
export class GetDecimalInterestSummaryQuery implements IQuery {
  constructor(
    public readonly wellId: string,
    public readonly effectiveDate?: Date,
  ) {}
}
