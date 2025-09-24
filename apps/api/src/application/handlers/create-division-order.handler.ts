import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateDivisionOrderCommand } from '../commands/create-division-order.command';
import { DivisionOrder } from '../../domain/entities/division-order.entity';
import { DecimalInterest } from '../../domain/value-objects/decimal-interest';
import type { IDivisionOrderRepository } from '../../domain/repositories/division-order.repository.interface';

/**
 * Create Division Order Command Handler
 * Handles the creation of new division orders
 */
@CommandHandler(CreateDivisionOrderCommand)
export class CreateDivisionOrderHandler
  implements ICommandHandler<CreateDivisionOrderCommand>
{
  constructor(
    @Inject('DivisionOrderRepository')
    private readonly divisionOrderRepository: IDivisionOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateDivisionOrderCommand): Promise<string> {
    try {
      // Create decimal interest value object
      const decimalInterest = new DecimalInterest(command.decimalInterest);

      // Check for overlapping division orders
      const overlapping = await this.divisionOrderRepository.findOverlapping(
        command.wellId,
        command.partnerId,
        command.effectiveDate,
        command.endDate,
      );

      if (overlapping.length > 0) {
        throw new ConflictException(
          `Division order overlaps with existing order for partner ${command.partnerId} in well ${command.wellId}`,
        );
      }

      // Validate decimal interest totals for the well
      const validation =
        await this.divisionOrderRepository.validateDecimalInterestTotals(
          command.wellId,
          command.effectiveDate,
        );

      // Calculate what the new total would be
      const newTotal = validation.totalInterest.add(decimalInterest);
      if (newTotal.getValue() > 1.0) {
        throw new BadRequestException(
          `Adding this decimal interest (${decimalInterest.getFormattedPercentage()}) would exceed 100%. Current total: ${validation.totalInterest.getFormattedPercentage()}`,
        );
      }

      // Create division order entity
      const divisionOrder = DivisionOrder.create(
        command.organizationId,
        command.wellId,
        command.partnerId,
        decimalInterest,
        command.effectiveDate,
        {
          endDate: command.endDate,
        },
      );

      // Save division order
      await this.divisionOrderRepository.save(divisionOrder);

      // Publish domain events
      const events = divisionOrder.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      divisionOrder.clearDomainEvents();

      return divisionOrder.getId();
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create division order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
