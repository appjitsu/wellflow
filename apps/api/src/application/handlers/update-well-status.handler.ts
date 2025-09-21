import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdateWellStatusCommand } from '../commands/update-well-status.command';
import type { WellRepository } from '../../domain/repositories/well.repository.interface';

/**
 * Update Well Status Command Handler
 * Handles well status updates
 */
@CommandHandler(UpdateWellStatusCommand)
export class UpdateWellStatusHandler
  implements ICommandHandler<UpdateWellStatusCommand>
{
  constructor(
    @Inject('WellRepository')
    private readonly wellRepository: WellRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateWellStatusCommand): Promise<void> {
    try {
      // Find the well
      const well = await this.wellRepository.findById(command.wellId);
      if (!well) {
        throw new NotFoundException(`Well with ID ${command.wellId} not found`);
      }

      // Update status (domain logic handles validation)
      well.updateStatus(command.newStatus, command.updatedBy);

      // Save well
      await this.wellRepository.save(well);

      // Publish domain events
      const events = well.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      well.clearDomainEvents();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update well status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
