import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetVendorStatisticsQuery } from '../queries/get-vendor-statistics.query';
import type {
  VendorRepository,
  VendorStatistics,
} from '../../domain/repositories/vendor.repository.interface';

/**
 * Get Vendor Statistics Query Handler
 * Handles retrieval of vendor statistics for dashboard display
 */
@QueryHandler(GetVendorStatisticsQuery)
export class GetVendorStatisticsHandler
  implements IQueryHandler<GetVendorStatisticsQuery>
{
  private readonly logger = new Logger(GetVendorStatisticsHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
  ) {}

  async execute(query: GetVendorStatisticsQuery): Promise<VendorStatistics> {
    this.logger.log(
      `Getting vendor statistics for organization: ${query.organizationId}`,
    );

    try {
      const statistics = await this.vendorRepository.getVendorStatistics(
        query.organizationId,
      );

      this.logger.log(
        `Retrieved vendor statistics for organization: ${query.organizationId}`,
      );
      return statistics;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to get vendor statistics: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
