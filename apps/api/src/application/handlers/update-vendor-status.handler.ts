import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { UpdateVendorStatusCommand } from '../commands/update-vendor-status.command';
import type { VendorRepository } from '../../domain/repositories/vendor.repository.interface';

/**
 * Update Vendor Status Command Handler
 * Handles vendor status changes (approve, reject, suspend, etc.)
 */
@CommandHandler(UpdateVendorStatusCommand)
export class UpdateVendorStatusHandler
  implements ICommandHandler<UpdateVendorStatusCommand>
{
  private readonly logger = new Logger(UpdateVendorStatusHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateVendorStatusCommand): Promise<void> {
    this.logger.log(
      `Updating vendor status: ${command.vendorId} to ${command.newStatus}`,
    );

    try {
      // Find vendor
      const vendor = await this.vendorRepository.findById(command.vendorId);
      if (!vendor) {
        throw new NotFoundException(`Vendor not found: ${command.vendorId}`);
      }

      // Update status
      vendor.updateStatus(command.newStatus, command.reason);

      // Save vendor
      await this.vendorRepository.save(vendor);

      // Publish domain events
      const domainEvents = vendor.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventBus.publish(event);
      }
      vendor.clearDomainEvents();

      this.logger.log(
        `Vendor status updated successfully: ${command.vendorId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to update vendor status: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
