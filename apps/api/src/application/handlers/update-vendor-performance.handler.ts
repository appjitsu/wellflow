import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { UpdateVendorPerformanceCommand } from '../commands/update-vendor-performance.command';
import type { VendorRepository } from '../../domain/repositories/vendor.repository.interface';

/**
 * Update Vendor Performance Handler
 * Handles the command to update a vendor's performance ratings
 */
@CommandHandler(UpdateVendorPerformanceCommand)
export class UpdateVendorPerformanceHandler
  implements ICommandHandler<UpdateVendorPerformanceCommand>
{
  private readonly logger = new Logger(UpdateVendorPerformanceHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateVendorPerformanceCommand): Promise<void> {
    this.logger.log(`Updating vendor performance: ${command.vendorId}`);

    try {
      // Find the vendor
      const vendor = await this.vendorRepository.findById(command.vendorId);
      if (!vendor) {
        throw new NotFoundException(
          `Vendor with ID ${command.vendorId} not found`,
        );
      }

      // Update performance ratings
      vendor.updatePerformanceRating(
        command.overallRating,
        command.safetyRating,
        command.qualityRating,
        command.timelinessRating,
        command.costEffectivenessRating,
        command.evaluatedBy || 'system',
      );

      // Save the vendor
      await this.vendorRepository.save(vendor);

      // Publish domain events
      const events = vendor.getDomainEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      vendor.clearDomainEvents();

      this.logger.log(
        `Vendor performance updated successfully: ${command.vendorId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update vendor performance: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
