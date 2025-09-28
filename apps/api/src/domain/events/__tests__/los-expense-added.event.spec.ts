import { LosExpenseAddedEvent } from '../los-expense-added.event';
import { ExpenseCategory, ExpenseType } from '../../enums/los-status.enum';

describe('LosExpenseAddedEvent', () => {
  let event: LosExpenseAddedEvent;

  beforeEach(() => {
    event = new LosExpenseAddedEvent(
      'los-123',
      'org-123',
      'lease-123',
      '2024-01',
      'expense-123',
      'Test Expense',
      ExpenseCategory.LABOR,
      ExpenseType.OPERATING,
      1000.0,
      'user-123',
      { test: true },
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should have correct event type', () => {
    expect(event.eventType).toBe('LosExpenseAdded');
  });

  it('should have occurred at timestamp', () => {
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should store all constructor parameters', () => {
    expect(event.losId).toBe('los-123');
    expect(event.organizationId).toBe('org-123');
    expect(event.leaseId).toBe('lease-123');
    expect(event.statementMonth).toBe('2024-01');
    expect(event.expenseId).toBe('expense-123');
    expect(event.description).toBe('Test Expense');
    expect(event.category).toBe(ExpenseCategory.LABOR);
    expect(event.type).toBe(ExpenseType.OPERATING);
    expect(event.amount).toBe(1000.0);
    expect(event.addedBy).toBe('user-123');
    expect(event.metadata).toEqual({ test: true });
  });

  it('should have a meaningful toString representation', () => {
    const result = event.toString();
    expect(result).toContain('Test Expense');
    expect(result).toContain('$1,000');
    expect(result).toContain('los-123');
    expect(result).toContain('user-123');
  });
});
