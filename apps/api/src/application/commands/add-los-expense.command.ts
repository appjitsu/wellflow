import { ICommand } from '@nestjs/cqrs';
import {
  ExpenseCategory,
  ExpenseType,
} from '../../domain/enums/los-status.enum';

/**
 * Add LOS Expense Command
 * Command to add an expense line item to a Lease Operating Statement
 */
export class AddLosExpenseCommand implements ICommand {
  constructor(
    public readonly losId: string,
    public readonly description: string,
    public readonly category: ExpenseCategory,
    public readonly type: ExpenseType,
    public readonly amount: number,
    public readonly currency: string = 'USD',
    public readonly vendorName?: string,
    public readonly invoiceNumber?: string,
    public readonly invoiceDate?: Date,
    public readonly notes?: string,
    public readonly addedBy?: string,
  ) {}
}
