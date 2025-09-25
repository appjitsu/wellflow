import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, ConflictException } from '@nestjs/common';
import { CreateVendorCommand } from '../commands/create-vendor.command';
import { Vendor } from '../../domain/entities/vendor.entity';
import type { VendorRepository } from '../../domain/repositories/vendor.repository.interface';
import { VendorCode } from '../../domain/value-objects/vendor-code';
import { randomUUID } from 'crypto';

/**
 * Create Vendor Command Handler
 * Handles the creation of new vendors following DDD principles
 */
@CommandHandler(CreateVendorCommand)
export class CreateVendorHandler
  implements ICommandHandler<CreateVendorCommand>
{
  private readonly logger = new Logger(CreateVendorHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateVendorCommand): Promise<string> {
    this.logger.log(
      `Creating vendor: ${command.vendorName} for organization: ${command.organizationId}`,
    );

    try {
      // Validate vendor code uniqueness
      const existingVendor = await this.vendorRepository.findByVendorCode(
        command.organizationId,
        command.vendorCode,
      );

      if (existingVendor) {
        throw new ConflictException(
          `Vendor code ${command.vendorCode} already exists in organization`,
        );
      }

      // Validate vendor code format
      const vendorCode = new VendorCode(command.vendorCode);

      // Create vendor entity
      const vendor = new Vendor(
        randomUUID(),
        command.organizationId,
        vendorCode.getValue(),
        command.vendorName,
        command.vendorType,
        command.billingAddress,
        command.paymentTerms,
        command.taxId,
      );

      // Set optional fields
      if (command.serviceAddress) {
        // Note: This would require adding a method to the Vendor entity
        // vendor.updateServiceAddress(command.serviceAddress);
      }

      if (command.website) {
        // Note: This would require adding a method to the Vendor entity
        // vendor.updateWebsite(command.website);
      }

      if (command.notes) {
        // Note: This would require adding a method to the Vendor entity
        // vendor.updateNotes(command.notes);
      }

      // Save vendor
      const savedVendor = await this.vendorRepository.save(vendor);

      // Publish domain events
      const domainEvents = vendor.getDomainEvents();
      for (const event of domainEvents) {
        await this.eventBus.publish(event);
      }
      vendor.clearDomainEvents();

      this.logger.log(`Vendor created successfully: ${savedVendor.getId()}`);
      return savedVendor.getId();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create vendor: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
