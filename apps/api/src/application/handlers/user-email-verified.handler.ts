import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserEmailVerifiedEvent } from '../../domain/events/user-email-verified.event';
import { EmailService } from '../services/email.service';

/**
 * User Email Verified Event Handler
 *
 * Handles the UserEmailVerifiedEvent by sending welcome email
 * Follows the Domain-Driven Design pattern for handling domain events
 */
@Injectable()
@EventsHandler(UserEmailVerifiedEvent)
export class UserEmailVerifiedHandler
  implements IEventHandler<UserEmailVerifiedEvent>
{
  private readonly logger = new Logger(UserEmailVerifiedHandler.name);

  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserEmailVerifiedEvent): Promise<void> {
    this.logger.log(`Handling UserEmailVerifiedEvent for user: ${event.email}`);

    try {
      // Send welcome email after successful verification
      await this.emailService.sendWelcomeEmail(
        event.userId,
        event.organizationId,
        event.email,
        // Note: We don't have firstName/lastName in the event
        // In a real implementation, we might need to fetch the user
        // or include more data in the event
        'User', // Placeholder - should be fetched from user entity
        '', // Placeholder - should be fetched from user entity
      );

      this.logger.log(`Welcome email queued for verified user: ${event.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email for ${event.email}:`,
        error,
      );
      // Don't throw - email verification should still succeed
      // The email system has its own retry logic
    }
  }
}
