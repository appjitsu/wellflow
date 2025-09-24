import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DistributeLosCommand } from '../commands/distribute-los.command';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';

/**
 * Distribute LOS Command Handler
 * Handles distributing finalized Lease Operating Statements to stakeholders
 */
@CommandHandler(DistributeLosCommand)
export class DistributeLosHandler
  implements ICommandHandler<DistributeLosCommand>
{
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DistributeLosCommand): Promise<void> {
    try {
      // Find the LOS
      const los = await this.losRepository.findById(command.losId);
      if (!los) {
        throw new NotFoundException(
          `Lease Operating Statement with ID ${command.losId} not found`,
        );
      }

      // Distribute the LOS
      los.distribute(
        command.distributedBy,
        command.distributionMethod,
        command.recipientCount,
      );

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
        `Failed to distribute Lease Operating Statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
