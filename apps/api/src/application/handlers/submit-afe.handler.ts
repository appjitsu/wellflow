import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmitAfeCommand } from '../commands/submit-afe.command';
import type { IAfeRepository } from '../../domain/repositories/afe.repository.interface';

/**
 * Submit AFE Command Handler
 * Handles AFE submission for approval
 */
@CommandHandler(SubmitAfeCommand)
export class SubmitAfeHandler implements ICommandHandler<SubmitAfeCommand> {
  constructor(
    @Inject('AfeRepository')
    private readonly afeRepository: IAfeRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SubmitAfeCommand): Promise<void> {
    try {
      // Find the AFE
      const afe = await this.afeRepository.findById(command.afeId);
      if (!afe) {
        throw new NotFoundException(`AFE with ID ${command.afeId} not found`);
      }

      // Submit AFE (domain logic handles validation)
      afe.submit(command.submittedBy);

      // Save AFE
      await this.afeRepository.save(afe);

      // Publish domain events
      const events = afe.getDomainEvents();
      for (const event of events) {
        await Promise.resolve(this.eventBus.publish(event)).catch(() => {}); // Ignore publishing errors
      }
      afe.clearDomainEvents();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit AFE: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
