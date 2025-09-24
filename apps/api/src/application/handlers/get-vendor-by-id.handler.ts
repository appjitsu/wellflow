import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { GetVendorByIdQuery } from '../queries/get-vendor-by-id.query';
import type { VendorRepository } from '../../domain/repositories/vendor.repository.interface';
import { Vendor } from '../../domain/entities/vendor.entity';

/**
 * Get Vendor by ID Query Handler
 * Handles retrieval of a specific vendor by ID
 */
@QueryHandler(GetVendorByIdQuery)
export class GetVendorByIdHandler implements IQueryHandler<GetVendorByIdQuery> {
  private readonly logger = new Logger(GetVendorByIdHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
  ) {}

  async execute(query: GetVendorByIdQuery): Promise<Vendor> {
    this.logger.log(`Getting vendor by ID: ${query.vendorId}`);

    try {
      const vendor = await this.vendorRepository.findById(query.vendorId);

      if (!vendor) {
        throw new NotFoundException(`Vendor not found: ${query.vendorId}`);
      }

      return vendor;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to get vendor by ID: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
