import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { UpdateVendorInsuranceCommand } from '../commands/update-vendor-insurance.command';
import type { VendorRepository } from '../../domain/repositories/vendor.repository.interface';

/**
 * Update Vendor Insurance Command Handler
 * Handles updates to vendor insurance information
 */
@CommandHandler(UpdateVendorInsuranceCommand)
export class UpdateVendorInsuranceHandler
  implements ICommandHandler<UpdateVendorInsuranceCommand>
{
  private readonly logger = new Logger(UpdateVendorInsuranceHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateVendorInsuranceCommand): Promise<void> {
    this.logger.log(`Updating vendor insurance: ${command.vendorId}`);

    try {
      // Find vendor
      const vendor = await this.vendorRepository.findById(command.vendorId);
      if (!vendor) {
        throw new NotFoundException(`Vendor not found: ${command.vendorId}`);
      }

      // Update insurance
      vendor.updateInsurance(command.insurance);

      // Save vendor
      await this.vendorRepository.save(vendor);

      // Publish domain events
      const domainEvents = vendor.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventBus.publish(event);
      }
      vendor.clearDomainEvents();

      this.logger.log(
        `Vendor insurance updated successfully: ${command.vendorId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update vendor insurance: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
