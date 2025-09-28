import { ExpenseLineItem } from '../expense-line-item';
import { Money } from '../money';
import { ExpenseCategory, ExpenseType } from '../../enums/los-status.enum';

describe('ExpenseLineItem', () => {
  let expenseLineItem: ExpenseLineItem;

  beforeEach(() => {
    expenseLineItem = new ExpenseLineItem(
      'test-id',
      'Test Expense',
      ExpenseCategory.LABOR,
      ExpenseType.OPERATING,
      new Money(100.0),
    );
  });

  it('should be defined', () => {
    expect(expenseLineItem).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(expenseLineItem.getId()).toBe('test-id');
    expect(expenseLineItem.getDescription()).toBe('Test Expense');
    expect(expenseLineItem.getCategory()).toBe(ExpenseCategory.LABOR);
    expect(expenseLineItem.getType()).toBe(ExpenseType.OPERATING);
    expect(expenseLineItem.getAmount().equals(new Money(100.0))).toBe(true);
  });

  it('should identify operating expense', () => {
    expect(expenseLineItem.isOperatingExpense()).toBe(true);
    expect(expenseLineItem.isCapitalExpense()).toBe(false);
  });
});
