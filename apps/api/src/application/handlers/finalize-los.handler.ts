import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { FinalizeLosCommand } from '../commands/finalize-los.command';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';

/**
 * Finalize LOS Command Handler
 * Handles finalizing Lease Operating Statements for distribution
 */
@CommandHandler(FinalizeLosCommand)
export class FinalizeLosHandler implements ICommandHandler<FinalizeLosCommand> {
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FinalizeLosCommand): Promise<void> {
    try {
      // Find the LOS
      const los = await this.losRepository.findById(command.losId);
      if (!los) {
        throw new NotFoundException(
          `Lease Operating Statement with ID ${command.losId} not found`,
        );
      }

      // Finalize the LOS
      los.finalize(command.finalizedBy);

      // Save LOS
      await this.losRepository.save(los);

      // Publish domain events
      const events = los.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      los.clearDomainEvents();
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to finalize Lease Operating Statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
