import { AddLosExpenseCommand } from '../add-los-expense.command';
import {
  ExpenseCategory,
  ExpenseType,
} from '../../../domain/enums/los-status.enum';

describe('AddLosExpenseCommand', () => {
  it('should create command with required fields', () => {
    const command = new AddLosExpenseCommand(
      'los-123',
      'Drilling expense',
      ExpenseCategory.DRILLING,
      ExpenseType.CAPITAL,
      1000,
    );

    expect(command.losId).toBe('los-123');
    expect(command.description).toBe('Drilling expense');
    expect(command.category).toBe(ExpenseCategory.DRILLING);
    expect(command.type).toBe(ExpenseType.CAPITAL);
    expect(command.amount).toBe(1000);
    expect(command.currency).toBe('USD');
  });

  it('should create command with all optional fields', () => {
    const invoiceDate = new Date('2024-01-01');
    const command = new AddLosExpenseCommand(
      'los-456',
      'Maintenance expense',
      ExpenseCategory.MAINTENANCE,
      ExpenseType.OPERATING,
      500,
      'CAD',
      'ABC Corp',
      'INV-001',
      invoiceDate,
      'Monthly maintenance',
      'user-123',
    );

    expect(command.losId).toBe('los-456');
    expect(command.description).toBe('Maintenance expense');
    expect(command.category).toBe(ExpenseCategory.MAINTENANCE);
    expect(command.type).toBe(ExpenseType.OPERATING);
    expect(command.amount).toBe(500);
    expect(command.currency).toBe('CAD');
    expect(command.vendorName).toBe('ABC Corp');
    expect(command.invoiceNumber).toBe('INV-001');
    expect(command.invoiceDate).toBe(invoiceDate);
    expect(command.notes).toBe('Monthly maintenance');
    expect(command.addedBy).toBe('user-123');
  });

  it('should implement ICommand interface', () => {
    const command = new AddLosExpenseCommand(
      'los-123',
      'Test expense',
      ExpenseCategory.LABOR,
      ExpenseType.OPERATING,
      100,
    );

    expect(command).toBeInstanceOf(AddLosExpenseCommand);
    // Verify it has the required ICommand structure
    expect(typeof command).toBe('object');
  });
});
