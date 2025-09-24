import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { AddVendorCertificationCommand } from '../commands/add-vendor-certification.command';
import type { VendorRepository } from '../../domain/repositories/vendor.repository.interface';
import { VendorCertification } from '../../domain/entities/vendor.entity';
import { randomUUID } from 'crypto';

/**
 * Add Vendor Certification Handler
 * Handles the command to add a certification to a vendor
 */
@CommandHandler(AddVendorCertificationCommand)
export class AddVendorCertificationHandler
  implements ICommandHandler<AddVendorCertificationCommand>
{
  private readonly logger = new Logger(AddVendorCertificationHandler.name);

  constructor(
    @Inject('VendorRepository')
    private readonly vendorRepository: VendorRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddVendorCertificationCommand): Promise<void> {
    this.logger.log(`Adding certification to vendor: ${command.vendorId}`);

    try {
      // Find the vendor
      const vendor = await this.vendorRepository.findById(command.vendorId);
      if (!vendor) {
        throw new NotFoundException(
          `Vendor with ID ${command.vendorId} not found`,
        );
      }

      // Create certification object
      const certification: VendorCertification = {
        id: randomUUID(),
        name: command.certificationName,
        issuingBody: command.issuingBody,
        certificationNumber: command.certificationNumber,
        issueDate: command.issueDate,
        expirationDate: command.expirationDate,
        isActive: true,
      };

      // Add certification to vendor
      vendor.addCertification(certification);

      // Save the vendor
      await this.vendorRepository.save(vendor);

      // Publish domain events
      const events = vendor.getDomainEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      vendor.clearDomainEvents();

      this.logger.log(
        `Certification added successfully to vendor: ${command.vendorId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to add certification to vendor: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
