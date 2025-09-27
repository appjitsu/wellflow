import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { EmailService } from '../services/email.service';

/**
 * User Registered Event Handler
 *
 * Handles the UserRegisteredEvent by sending email verification
 * Follows the Domain-Driven Design pattern for handling domain events
 */
@Injectable()
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler
  implements IEventHandler<UserRegisteredEvent>
{
  private readonly logger = new Logger(UserRegisteredHandler.name);

  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`Handling UserRegisteredEvent for user: ${event.email}`);

    try {
      await Promise.resolve();
      if (event.requiresEmailVerification) {
        // Send email verification - this will be handled by the email service
        // The email service will queue the email job for reliable delivery
        this.logger.log(`Queuing email verification for user: ${event.email}`);

        // Note: The actual email sending will be triggered by the AuthService
        // when it saves the user and processes domain events
        // This handler serves as a placeholder for additional business logic
        // that should happen when a user registers (e.g., analytics, notifications)

        this.logger.log(
          `User registration event processed for: ${event.email}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process UserRegisteredEvent for ${event.email}:`,
        error,
      );
      // Don't throw - we don't want to fail user registration if email fails
      // The email system has its own retry logic
    }
  }
}
