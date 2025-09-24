import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { AddLosExpenseCommand } from '../commands/add-los-expense.command';
import type { ILosRepository } from '../../domain/repositories/lease-operating-statement.repository.interface';
import { ExpenseLineItem } from '../../domain/value-objects/expense-line-item';
import { Money } from '../../domain/value-objects/money';
import { randomUUID } from 'crypto';

/**
 * Add LOS Expense Command Handler
 * Handles adding expense line items to Lease Operating Statements
 */
@CommandHandler(AddLosExpenseCommand)
export class AddLosExpenseHandler
  implements ICommandHandler<AddLosExpenseCommand>
{
  constructor(
    @Inject('LosRepository')
    private readonly losRepository: ILosRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AddLosExpenseCommand): Promise<string> {
    try {
      // Find the LOS
      const los = await this.losRepository.findById(command.losId);
      if (!los) {
        throw new NotFoundException(
          `Lease Operating Statement with ID ${command.losId} not found`,
        );
      }

      // Validate amount
      if (command.amount < 0) {
        throw new BadRequestException('Expense amount cannot be negative');
      }

      // Create expense line item
      const expenseId = randomUUID();
      const amount = new Money(command.amount, command.currency);
      const expenseLineItem = new ExpenseLineItem(
        expenseId,
        command.description,
        command.category,
        command.type,
        amount,
        {
          vendorName: command.vendorName,
          invoiceNumber: command.invoiceNumber,
          invoiceDate: command.invoiceDate,
          notes: command.notes,
        },
      );

      // Add expense to LOS
      los.addExpenseLineItem(expenseLineItem, command.addedBy || 'system');

      // Save LOS
      await this.losRepository.save(los);

      // Publish domain events
      const events = los.getDomainEvents();
      for (const event of events) {
        this.eventBus.publish(event);
      }
      los.clearDomainEvents();

      return expenseId;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add expense to Lease Operating Statement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
