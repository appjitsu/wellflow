import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetLosExpenseSummaryQuery } from '../queries/get-los-expense-summary.query';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';
import { StatementMonth } from '../../domain/value-objects/statement-month';
import { LosExpenseSummaryDto } from '../dtos/los.dto';

/**
 * Get LOS Expense Summary Query Handler
 * Handles retrieving expense summary across leases for a date range
 */
@QueryHandler(GetLosExpenseSummaryQuery)
export class GetLosExpenseSummaryHandler
  implements IQueryHandler<GetLosExpenseSummaryQuery>
{
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
  ) {}

  async execute(
    query: GetLosExpenseSummaryQuery,
  ): Promise<LosExpenseSummaryDto[]> {
    const startMonth = new StatementMonth(query.startYear, query.startMonth);
    const endMonth = new StatementMonth(query.endYear, query.endMonth);

    const summaries = await this.losRepository.getExpenseSummaryByLease(
      query.organizationId,
      startMonth,
      endMonth,
    );

    return summaries.map(
      (summary) =>
        new LosExpenseSummaryDto({
          leaseId: summary.leaseId,
          totalOperatingExpenses: summary.totalOperatingExpenses,
          totalCapitalExpenses: summary.totalCapitalExpenses,
          totalExpenses: summary.totalExpenses,
          statementCount: summary.statementCount,
        }),
    );
  }
}
