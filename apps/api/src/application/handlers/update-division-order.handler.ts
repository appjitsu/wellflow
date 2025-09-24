import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateDivisionOrderCommand } from '../commands/update-division-order.command';
import { DecimalInterest } from '../../domain/value-objects/decimal-interest';
import type { IDivisionOrderRepository } from '../../domain/repositories/division-order.repository.interface';

/**
 * Update Division Order Command Handler
 * Handles updating division order decimal interest
 */
@CommandHandler(UpdateDivisionOrderCommand)
export class UpdateDivisionOrderHandler
  implements ICommandHandler<UpdateDivisionOrderCommand>
{
  constructor(
    @Inject('DivisionOrderRepository')
    private readonly divisionOrderRepository: IDivisionOrderRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateDivisionOrderCommand): Promise<void> {
    try {
      // Find the division order
      const divisionOrder = await this.divisionOrderRepository.findById(
        command.divisionOrderId,
      );
      if (!divisionOrder) {
        throw new NotFoundException(
          `Division order with ID ${command.divisionOrderId} not found`,
        );
      }

      // Create new decimal interest value object
      const newDecimalInterest = new DecimalInterest(command.decimalInterest);

      // Validate decimal interest totals for the well (excluding current order)
      const validation =
        await this.divisionOrderRepository.validateDecimalInterestTotals(
          divisionOrder.getWellId(),
          command.effectiveDate,
        );

      // Calculate what the new total would be (subtract current, add new)
      const currentInterest = divisionOrder.getDecimalInterest();
      const adjustedTotal = validation.totalInterest
        .subtract(currentInterest)
        .add(newDecimalInterest);

      if (adjustedTotal.getValue() > 1.0) {
        throw new BadRequestException(
          `Updating to this decimal interest (${newDecimalInterest.getFormattedPercentage()}) would exceed 100%. Current total without this order: ${validation.totalInterest.subtract(currentInterest).getFormattedPercentage()}`,
        );
      }

      // Update decimal interest (domain logic handles validation and events)
      divisionOrder.updateDecimalInterest(
        newDecimalInterest,
        command.updatedBy,
      );

      // Save division order
      await this.divisionOrderRepository.save(divisionOrder);

      // Publish domain events
      const events = divisionOrder.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      divisionOrder.clearDomainEvents();
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update division order: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
