import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateAfeCommand } from '../commands/create-afe.command';
import type { IAfeRepository } from '../../domain/repositories/afe.repository.interface';
import { Afe } from '../../domain/entities/afe.entity';
import { AfeNumber } from '../../domain/value-objects/afe-number';
import { Money } from '../../domain/value-objects/money';
import { randomUUID } from 'crypto';

/**
 * Create AFE Command Handler
 * Handles the creation of new AFEs
 */
@CommandHandler(CreateAfeCommand)
export class CreateAfeHandler implements ICommandHandler<CreateAfeCommand> {
  constructor(
    @Inject('AfeRepository')
    private readonly afeRepository: IAfeRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateAfeCommand): Promise<string> {
    try {
      // Check if AFE number already exists
      const existingAfe = await this.afeRepository.findByAfeNumber(
        command.organizationId,
        command.afeNumber,
      );

      if (existingAfe) {
        throw new ConflictException(
          `AFE with number ${command.afeNumber} already exists`,
        );
      }

      // Validate business rules
      if (
        command.totalEstimatedCost !== undefined &&
        command.totalEstimatedCost < 0
      ) {
        throw new BadRequestException(
          'Total estimated cost cannot be negative',
        );
      }

      // Create value objects
      const afeNumber = new AfeNumber(command.afeNumber);
      const totalEstimatedCost = command.totalEstimatedCost
        ? new Money(command.totalEstimatedCost)
        : undefined;

      // Create AFE entity
      const afeId = randomUUID();
      const afe = new Afe(
        afeId,
        command.organizationId,
        afeNumber,
        command.afeType,
        {
          wellId: command.wellId,
          leaseId: command.leaseId,
          totalEstimatedCost,
          description: command.description,
        },
      );

      // Save AFE
      await this.afeRepository.save(afe);

      // Publish domain events
      const events = afe.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      afe.clearDomainEvents();

      return afeId;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create AFE: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
