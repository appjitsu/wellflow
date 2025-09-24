import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApproveAfeCommand } from '../commands/approve-afe.command';
import type { IAfeRepository } from '../../domain/repositories/afe.repository.interface';
import { Money } from '../../domain/value-objects/money';

/**
 * Approve AFE Command Handler
 * Handles AFE approval
 */
@CommandHandler(ApproveAfeCommand)
export class ApproveAfeHandler implements ICommandHandler<ApproveAfeCommand> {
  constructor(
    @Inject('AfeRepository')
    private readonly afeRepository: IAfeRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApproveAfeCommand): Promise<void> {
    try {
      // Find the AFE
      const afe = await this.afeRepository.findById(command.afeId);
      if (!afe) {
        throw new NotFoundException(`AFE with ID ${command.afeId} not found`);
      }

      // Create approved amount if provided
      const approvedAmount = command.approvedAmount
        ? new Money(command.approvedAmount)
        : undefined;

      // Approve AFE (domain logic handles validation)
      afe.approve(command.approvedBy, approvedAmount);

      // Save AFE
      await this.afeRepository.save(afe);

      // Publish domain events
      const events = afe.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      afe.clearDomainEvents();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to approve AFE: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
