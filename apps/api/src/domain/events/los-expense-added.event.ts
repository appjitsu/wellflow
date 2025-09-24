import { ExpenseCategory, ExpenseType } from '../enums/los-status.enum';

/**
 * Lease Operating Statement Expense Added Domain Event
 * Raised when an expense line item is added to a LOS
 */
export class LosExpenseAddedEvent {
  public readonly eventType = 'LosExpenseAdded';
  public readonly occurredAt: Date;

  constructor(
    public readonly losId: string,
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly statementMonth: string,
    public readonly expenseId: string,
    public readonly description: string,
    public readonly category: ExpenseCategory,
    public readonly type: ExpenseType,
    public readonly amount: number,
    public readonly addedBy: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.occurredAt = new Date();
  }

  toString(): string {
    return `Expense ${this.description} ($${this.amount.toLocaleString()}) added to LOS ${this.losId} by ${this.addedBy}`;
  }
}
