import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateWellCommand } from '../commands/create-well.command';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { Well } from '../../domain/entities/well.entity';
import { ApiNumber } from '../../domain/value-objects/api-number';
import { Location } from '../../domain/value-objects/location';
import { Coordinates } from '../../domain/value-objects/coordinates';
import { randomUUID } from 'crypto';

/**
 * Create Well Command Handler
 * Handles the creation of new wells
 */
@CommandHandler(CreateWellCommand)
export class CreateWellHandler implements ICommandHandler<CreateWellCommand> {
  constructor(
    @Inject('WellRepository')
    private readonly wellRepository: WellRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateWellCommand): Promise<string> {
    try {
      // Create value objects
      const apiNumber = new ApiNumber(command.apiNumber);
      const coordinates = new Coordinates(
        command.location.latitude,
        command.location.longitude,
      );
      const location = new Location(coordinates, {
        address: command.location.address,
        county: command.location.county,
        state: command.location.state,
        country: command.location.country,
      });

      // Check if API number already exists
      const existingWell = await this.wellRepository.findByApiNumber(apiNumber);
      if (existingWell) {
        throw new ConflictException(
          `Well with API number ${apiNumber.getValue()} already exists`,
        );
      }

      // Create well entity
      const wellId = randomUUID();
      const well = new Well(
        wellId,
        apiNumber,
        command.name,
        command.operatorId,
        command.wellType,
        location,
        {
          leaseId: command.leaseId,
          spudDate: command.spudDate,
          totalDepth: command.totalDepth,
        },
      );

      // Save well
      await this.wellRepository.save(well);

      // Publish domain events
      const events = well.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      well.clearDomainEvents();

      return wellId;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create well: ${error.message}`);
    }
  }
}
