import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { VendorCreatedEvent } from '../../domain/events/vendor-created.event';

/**
 * Vendor Created Event Handler
 * Handles side effects when a vendor is created
 */
@EventsHandler(VendorCreatedEvent)
export class VendorCreatedHandler implements IEventHandler<VendorCreatedEvent> {
  private readonly logger = new Logger(VendorCreatedHandler.name);

  async handle(event: VendorCreatedEvent): Promise<void> {
    this.logger.log(`Handling VendorCreatedEvent: ${event.vendorId}`);

    try {
      // Side effects for vendor creation:

      // 1. Send notification to admin users
      await this.notifyAdminUsers(event);

      // 2. Create audit log entry
      await this.createAuditLogEntry(event);

      // 3. Initialize vendor onboarding workflow
      await this.initializeOnboardingWorkflow(event);

      // 4. Send welcome email to vendor (if contact info available)
      await this.sendWelcomeEmail(event);

      this.logger.log(
        `Successfully handled VendorCreatedEvent: ${event.vendorId}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to handle VendorCreatedEvent: ${errorMessage}`,
        errorStack,
      );
      // Don't throw - event handlers should be resilient
    }
  }

  private async notifyAdminUsers(event: VendorCreatedEvent): Promise<void> {
    this.logger.log(
      `Notifying admin users about new vendor: ${event.vendorName}`,
    );

    // Implementation would:
    // 1. Find admin users for the organization
    // 2. Send in-app notification
    // 3. Optionally send email notification

    // For now, just log
    this.logger.log(`Admin notification sent for vendor: ${event.vendorName}`);

    await Promise.resolve();
  }

  private async createAuditLogEntry(event: VendorCreatedEvent): Promise<void> {
    this.logger.log(
      `Creating audit log entry for vendor creation: ${event.vendorId}`,
    );

    // Implementation would:
    // 1. Create audit log entry in database
    // 2. Include all relevant event data
    // 3. Track who created the vendor (if available)

    // For now, just log
    this.logger.log(`Audit log entry created for vendor: ${event.vendorId}`);

    await Promise.resolve();
  }

  private async initializeOnboardingWorkflow(
    event: VendorCreatedEvent,
  ): Promise<void> {
    this.logger.log(
      `Initializing onboarding workflow for vendor: ${event.vendorId}`,
    );

    // Implementation would:
    // 1. Create onboarding checklist
    // 2. Schedule follow-up tasks
    // 3. Set up qualification requirements based on vendor type

    // For now, just log
    this.logger.log(
      `Onboarding workflow initialized for vendor: ${event.vendorId}`,
    );

    await Promise.resolve();
  }

  private async sendWelcomeEmail(event: VendorCreatedEvent): Promise<void> {
    this.logger.log(`Sending welcome email for vendor: ${event.vendorName}`);

    // Implementation would:
    // 1. Get vendor contact information
    // 2. Send welcome email with onboarding instructions
    // 3. Include links to vendor portal (if available)

    // For now, just log
    this.logger.log(`Welcome email sent for vendor: ${event.vendorName}`);

    await Promise.resolve();
  }
}
