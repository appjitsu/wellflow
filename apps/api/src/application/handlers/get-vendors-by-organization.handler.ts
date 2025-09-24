import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetVendorsByOrganizationQuery } from '../queries/get-vendors-by-organization.query';
import type {
  VendorRepository,
  VendorSearchResult,
} from '../../domain/repositories/vendor.repository.interface';

/**
 * Get Vendors by Organization Query Handler
 * Handles retrieval of vendors for an organization with filtering and pagination
 */
@QueryHandler(GetVendorsByOrganizationQuery)
export class GetVendorsByOrganizationHandler
  implements IQueryHandler<GetVendorsByOrganizationQuery>
{
  private readonly logger = new Logger(GetVendorsByOrganizationHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
  ) {}

  async execute(
    query: GetVendorsByOrganizationQuery,
  ): Promise<VendorSearchResult> {
    this.logger.log(
      `Getting vendors for organization: ${query.organizationId}`,
    );

    try {
      const result = await this.vendorRepository.findByOrganization(
        query.organizationId,
        query.filters,
        query.pagination,
      );

      this.logger.log(
        `Found ${result.total} vendors for organization: ${query.organizationId}`,
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to get vendors by organization: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
