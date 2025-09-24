import { LeaseOperatingStatement } from '../lease-operating-statement.entity';
import { StatementMonth } from '../../value-objects/statement-month';
import { ExpenseLineItem } from '../../value-objects/expense-line-item';
import { Money } from '../../value-objects/money';
import {
  LosStatus,
  ExpenseCategory,
  ExpenseType,
} from '../../enums/los-status.enum';
import { LosCreatedEvent } from '../../events/los-created.event';
import { LosExpenseAddedEvent } from '../../events/los-expense-added.event';
import { LosFinalizedEvent } from '../../events/los-finalized.event';

describe('LeaseOperatingStatement Entity', () => {
  const mockId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOrgId = '123e4567-e89b-12d3-a456-426614174001';
  const mockLeaseId = '123e4567-e89b-12d3-a456-426614174002';
  const mockStatementMonth = new StatementMonth(2024, 3);

  describe('constructor', () => {
    it('should create a new LOS with valid data', () => {
      const los = new LeaseOperatingStatement(
        mockId,
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
      );

      expect(los.getId()).toBe(mockId);
      expect(los.getOrganizationId()).toBe(mockOrgId);
      expect(los.getLeaseId()).toBe(mockLeaseId);
      expect(los.getStatementMonth()).toBe(mockStatementMonth);
      expect(los.getStatus()).toBe(LosStatus.DRAFT);
      expect(los.getTotalExpenses()).toBe(0);
      expect(los.getOperatingExpenses()).toBe(0);
      expect(los.getCapitalExpenses()).toBe(0);
      expect(los.getExpenseLineItems()).toHaveLength(0);
    });

    it('should emit LosCreatedEvent on creation', () => {
      const los = new LeaseOperatingStatement(
        mockId,
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
      );

      const events = los.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LosCreatedEvent);
      expect((events[0] as LosCreatedEvent).losId).toBe(mockId);
    });

    it('should accept optional notes', () => {
      const notes = 'Test notes';
      const los = new LeaseOperatingStatement(
        mockId,
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
        { notes },
      );

      expect(los.getNotes()).toBe(notes);
    });
  });

  describe('addExpenseLineItem', () => {
    let los: LeaseOperatingStatement;
    let expenseItem: ExpenseLineItem;

    beforeEach(() => {
      los = new LeaseOperatingStatement(
        mockId,
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
      );
      los.clearDomainEvents(); // Clear creation event

      expenseItem = new ExpenseLineItem(
        'expense-1',
        'Test expense',
        ExpenseCategory.UTILITIES,
        ExpenseType.OPERATING,
        new Money(1000, 'USD'),
      );
    });

    it('should add expense line item successfully', () => {
      los.addExpenseLineItem(expenseItem, 'user-1');

      expect(los.getExpenseLineItems()).toHaveLength(1);
      expect(los.getExpenseLineItems()[0]).toBe(expenseItem);
      expect(los.getTotalExpenses()).toBe(1000);
      expect(los.getOperatingExpenses()).toBe(1000);
      expect(los.getCapitalExpenses()).toBe(0);
    });

    it('should emit LosExpenseAddedEvent when expense is added', () => {
      los.addExpenseLineItem(expenseItem, 'user-1');

      const events = los.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LosExpenseAddedEvent);
      expect((events[0] as LosExpenseAddedEvent).losId).toBe(mockId);
      expect((events[0] as LosExpenseAddedEvent).expenseId).toBe('expense-1');
    });

    it('should calculate capital expenses correctly', () => {
      const capitalExpense = new ExpenseLineItem(
        'expense-2',
        'Capital expense',
        ExpenseCategory.EQUIPMENT,
        ExpenseType.CAPITAL,
        new Money(5000, 'USD'),
      );

      los.addExpenseLineItem(expenseItem, 'user-1');
      los.addExpenseLineItem(capitalExpense, 'user-1');

      expect(los.getTotalExpenses()).toBe(6000);
      expect(los.getOperatingExpenses()).toBe(1000);
      expect(los.getCapitalExpenses()).toBe(5000);
    });

    it('should throw error when adding expense to finalized LOS', () => {
      // First add an expense so we can finalize
      los.addExpenseLineItem(expenseItem, 'user-1');
      los.finalize('user-1');

      const anotherExpense = new ExpenseLineItem(
        'expense-2',
        'Another expense',
        ExpenseCategory.UTILITIES,
        ExpenseType.OPERATING,
        new Money(500, 'USD'),
      );

      expect(() => {
        los.addExpenseLineItem(anotherExpense, 'user-1');
      }).toThrow('Cannot add expenses to finalized LOS');
    });

    it('should throw error when adding duplicate expense ID', () => {
      los.addExpenseLineItem(expenseItem, 'user-1');

      expect(() => {
        los.addExpenseLineItem(expenseItem, 'user-1');
      }).toThrow('Expense line item with ID expense-1 already exists');
    });
  });

  describe('finalize', () => {
    let los: LeaseOperatingStatement;

    beforeEach(() => {
      los = new LeaseOperatingStatement(
        mockId,
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
      );
      los.clearDomainEvents();
    });

    it('should finalize LOS with expenses', () => {
      const expenseItem = new ExpenseLineItem(
        'expense-1',
        'Test expense',
        ExpenseCategory.UTILITIES,
        ExpenseType.OPERATING,
        new Money(1000, 'USD'),
      );
      los.addExpenseLineItem(expenseItem, 'user-1');
      los.clearDomainEvents();

      los.finalize('user-1');

      expect(los.getStatus()).toBe(LosStatus.FINALIZED);
      expect(los.getFinalizedAt()).toBeDefined();
      expect(los.getFinalizedBy()).toBe('user-1');
    });

    it('should emit LosFinalizedEvent when finalized', () => {
      const expenseItem = new ExpenseLineItem(
        'expense-1',
        'Test expense',
        ExpenseCategory.UTILITIES,
        ExpenseType.OPERATING,
        new Money(1000, 'USD'),
      );
      los.addExpenseLineItem(expenseItem, 'user-1');
      los.clearDomainEvents();

      los.finalize('user-1');

      const events = los.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LosFinalizedEvent);
      expect((events[0] as LosFinalizedEvent).losId).toBe(mockId);
    });

    it('should throw error when finalizing LOS without expenses', () => {
      expect(() => {
        los.finalize('user-1');
      }).toThrow('Cannot finalize LOS without expenses');
    });

    it('should throw error when finalizing already finalized LOS', () => {
      const expenseItem = new ExpenseLineItem(
        'expense-1',
        'Test expense',
        ExpenseCategory.UTILITIES,
        ExpenseType.OPERATING,
        new Money(1000, 'USD'),
      );
      los.addExpenseLineItem(expenseItem, 'user-1');
      los.finalize('user-1');

      expect(() => {
        los.finalize('user-1');
      }).toThrow('LOS is already finalized');
    });
  });

  describe('distribute', () => {
    let los: LeaseOperatingStatement;

    beforeEach(() => {
      los = new LeaseOperatingStatement(
        mockId,
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
      );
      const expenseItem = new ExpenseLineItem(
        'expense-1',
        'Test expense',
        ExpenseCategory.UTILITIES,
        ExpenseType.OPERATING,
        new Money(1000, 'USD'),
      );
      los.addExpenseLineItem(expenseItem, 'user-1');
      los.finalize('user-1');
      los.clearDomainEvents();
    });

    it('should distribute finalized LOS', () => {
      los.distribute('user-1', 'email', 1);

      expect(los.getStatus()).toBe(LosStatus.DISTRIBUTED);
      expect(los.getDistributedAt()).toBeDefined();
      expect(los.getDistributedBy()).toBe('user-1');
    });

    it('should throw error when distributing non-finalized LOS', () => {
      const draftLos = new LeaseOperatingStatement(
        'draft-id',
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
      );

      expect(() => {
        draftLos.distribute('user-1', 'email', 1);
      }).toThrow('Can only distribute finalized LOS');
    });
  });

  describe('persistence methods', () => {
    it('should convert to persistence format', () => {
      const los = new LeaseOperatingStatement(
        mockId,
        mockOrgId,
        mockLeaseId,
        mockStatementMonth,
        { notes: 'Test notes' },
      );

      const expenseItem = new ExpenseLineItem(
        'expense-1',
        'Test expense',
        ExpenseCategory.UTILITIES,
        ExpenseType.OPERATING,
        new Money(1000, 'USD'),
      );
      los.addExpenseLineItem(expenseItem, 'user-1');

      const persistence = los.toPersistence();

      expect(persistence.id).toBe(mockId);
      expect(persistence.organizationId).toBe(mockOrgId);
      expect(persistence.leaseId).toBe(mockLeaseId);
      expect(persistence.statementMonth).toBe('2024-03');
      expect(persistence.totalExpenses).toBe('1000');
      expect(persistence.operatingExpenses).toBe('1000');
      expect(persistence.capitalExpenses).toBe('0');
      expect(persistence.status).toBe(LosStatus.DRAFT);
      expect(persistence.notes).toBe('Test notes');
      expect(persistence.expenseBreakdown).toBeDefined();
    });

    it('should create from persistence format', () => {
      const persistenceData = {
        id: mockId,
        organizationId: mockOrgId,
        leaseId: mockLeaseId,
        statementMonth: '2024-03',
        totalExpenses: '1000',
        operatingExpenses: '1000',
        capitalExpenses: '0',
        status: LosStatus.DRAFT,
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        expenseBreakdown: JSON.stringify([
          {
            id: 'expense-1',
            description: 'Test expense',
            category: ExpenseCategory.UTILITIES,
            type: ExpenseType.OPERATING,
            amount: { amount: 1000, currency: 'USD' },
          },
        ]),
      };

      const los = LeaseOperatingStatement.fromPersistence(persistenceData);

      expect(los.getId()).toBe(mockId);
      expect(los.getOrganizationId()).toBe(mockOrgId);
      expect(los.getLeaseId()).toBe(mockLeaseId);
      expect(los.getStatementMonth().toString()).toBe('2024-03');
      expect(los.getTotalExpenses()).toBe(1000);
      expect(los.getStatus()).toBe(LosStatus.DRAFT);
      expect(los.getNotes()).toBe('Test notes');
      expect(los.getExpenseLineItems()).toHaveLength(1);
    });
  });
});
