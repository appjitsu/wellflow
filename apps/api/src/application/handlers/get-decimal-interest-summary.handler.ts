import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetDecimalInterestSummaryQuery } from '../queries/get-decimal-interest-summary.query';
import { DecimalInterestSummaryDto } from '../dtos/division-order.dto';
import type { IDivisionOrderRepository } from '../../domain/repositories/division-order.repository.interface';
import { DecimalInterest } from '../../domain/value-objects/decimal-interest';

/**
 * Get Decimal Interest Summary Query Handler
 * Handles retrieving decimal interest summary for a well
 */
@QueryHandler(GetDecimalInterestSummaryQuery)
export class GetDecimalInterestSummaryHandler
  implements IQueryHandler<GetDecimalInterestSummaryQuery>
{
  constructor(
    @Inject('DivisionOrderRepository')
    private readonly divisionOrderRepository: IDivisionOrderRepository,
  ) {}

  async execute(
    query: GetDecimalInterestSummaryQuery,
  ): Promise<DecimalInterestSummaryDto> {
    const effectiveDate = query.effectiveDate || new Date();

    const summary =
      await this.divisionOrderRepository.getDecimalInterestSummary(
        query.wellId,
        effectiveDate,
      );

    return {
      wellId: query.wellId,
      totalInterest: summary.totalInterest.getFormattedDecimal(),
      totalInterestPercentage: summary.totalInterest.getFormattedPercentage(),
      isValid: summary.totalInterest.equals(DecimalInterest.full()),
      effectiveDate,
      partnerInterests: summary.partnerInterests.map((interest) => ({
        partnerId: interest.partnerId,
        decimalInterest: interest.decimalInterest.getFormattedDecimal(),
        decimalInterestPercentage:
          interest.decimalInterest.getFormattedPercentage(),
        divisionOrderId: interest.divisionOrderId,
      })),
    };
  }
}
