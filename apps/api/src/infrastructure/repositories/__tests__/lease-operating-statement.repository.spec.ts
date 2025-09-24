import { Test, TestingModule } from '@nestjs/testing';
import { LosRepository } from '../lease-operating-statement.repository';
import { LeaseOperatingStatement } from '../../../domain/entities/lease-operating-statement.entity';
import { StatementMonth } from '../../../domain/value-objects/statement-month';
import { ExpenseLineItem } from '../../../domain/value-objects/expense-line-item';
import { Money } from '../../../domain/value-objects/money';
import {
  LosStatus,
  ExpenseCategory,
  ExpenseType,
} from '../../../domain/enums/los-status.enum';

// Mock database connection
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

// Mock query builder
const mockQuery = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
};

// Setup mock implementations
mockDb.select.mockReturnValue(mockQuery);
mockDb.insert.mockReturnValue(mockQuery);
mockDb.update.mockReturnValue(mockQuery);
mockDb.delete.mockReturnValue(mockQuery);

describe('LosRepository', () => {
  let repository: LosRepository;
  let mockLos: LeaseOperatingStatement;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LosRepository,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<LosRepository>(LosRepository);

    // Create mock LOS for testing
    mockLos = new LeaseOperatingStatement(
      'los-123',
      'org-456',
      'lease-789',
      new StatementMonth(2024, 3),
      { notes: 'Test LOS' },
    );

    // Add expense to mock LOS
    const expense = new ExpenseLineItem(
      'expense-1',
      'Test expense',
      ExpenseCategory.UTILITIES,
      ExpenseType.OPERATING,
      new Money(1000, 'USD'),
    );
    mockLos.addExpenseLineItem(expense, 'user-1');

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should insert new LOS when it does not exist', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]); // findById returns empty array
      mockQuery.mockResolvedValueOnce([{}]); // insert returns success

      // Act
      const result = await repository.save(mockLos);

      // Assert
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toBe(mockLos);
    });

    it('should update existing LOS when it exists', async () => {
      // Arrange
      const existingRecord = {
        id: 'los-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        statementMonth: new Date('2024-03-01'),
        totalExpenses: 500,
        operatingExpenses: 500,
        capitalExpenses: 0,
        status: LosStatus.DRAFT,
        notes: 'Old notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        expenseBreakdown: '[]',
      };
      mockQuery.mockResolvedValueOnce([existingRecord]); // findById returns existing
      mockQuery.mockResolvedValueOnce([{}]); // update returns success

      // Act
      const result = await repository.save(mockLos);

      // Assert
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toBe(mockLos);
    });
  });

  describe('findById', () => {
    it('should return LOS when found', async () => {
      // Arrange
      const mockRecord = {
        id: 'los-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        statementMonth: new Date('2024-03-01'),
        totalExpenses: 1000,
        operatingExpenses: 1000,
        capitalExpenses: 0,
        status: LosStatus.DRAFT,
        notes: 'Test LOS',
        createdAt: new Date(),
        updatedAt: new Date(),
        expenseBreakdown: JSON.stringify([
          {
            id: 'expense-1',
            description: 'Test expense',
            category: ExpenseCategory.UTILITIES,
            type: ExpenseType.OPERATING,
            amount: { value: 1000, currency: 'USD' },
          },
        ]),
      };
      mockQuery.mockResolvedValueOnce([mockRecord]);

      // Act
      const result = await repository.findById('los-123');

      // Assert
      expect(result).toBeInstanceOf(LeaseOperatingStatement);
      expect(result?.getId()).toBe('los-123');
      expect(result?.getOrganizationId()).toBe('org-456');
      expect(result?.getLeaseId()).toBe('lease-789');
      expect(result?.getTotalExpenses()).toBe(1000);
    });

    it('should return null when not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByOrganizationId', () => {
    it('should return LOS list for organization', async () => {
      // Arrange
      const mockRecords = [
        {
          id: 'los-1',
          organizationId: 'org-456',
          leaseId: 'lease-789',
          statementMonth: new Date('2024-03-01'),
          totalExpenses: 1000,
          operatingExpenses: 1000,
          capitalExpenses: 0,
          status: LosStatus.DRAFT,
          notes: 'Test LOS 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          expenseBreakdown: '[]',
        },
        {
          id: 'los-2',
          organizationId: 'org-456',
          leaseId: 'lease-790',
          statementMonth: new Date('2024-02-01'),
          totalExpenses: 2000,
          operatingExpenses: 1500,
          capitalExpenses: 500,
          status: LosStatus.FINALIZED,
          notes: 'Test LOS 2',
          createdAt: new Date(),
          updatedAt: new Date(),
          expenseBreakdown: '[]',
        },
      ];
      mockQuery.mockResolvedValueOnce(mockRecords);

      // Act
      const result = await repository.findByOrganizationId('org-456');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(LeaseOperatingStatement);
      expect(result[1]).toBeInstanceOf(LeaseOperatingStatement);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should apply status filter when provided', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      await repository.findByOrganizationId('org-456', {
        status: LosStatus.DRAFT,
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(mockQuery.where).toHaveBeenCalled();
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.offset).toHaveBeenCalledWith(0);
    });
  });

  describe('findByLeaseIdAndMonth', () => {
    it('should return LOS when found for lease and month', async () => {
      // Arrange
      const mockRecord = {
        id: 'los-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        statementMonth: new Date('2024-03-01'),
        totalExpenses: 1000,
        operatingExpenses: 1000,
        capitalExpenses: 0,
        status: LosStatus.DRAFT,
        notes: 'Test LOS',
        createdAt: new Date(),
        updatedAt: new Date(),
        expenseBreakdown: '[]',
      };
      mockQuery.mockResolvedValueOnce([mockRecord]);

      // Act
      const result = await repository.findByLeaseIdAndMonth(
        'lease-789',
        new StatementMonth(2024, 3),
      );

      // Assert
      expect(result).toBeInstanceOf(LeaseOperatingStatement);
      expect(result?.getId()).toBe('los-123');
      expect(mockQuery.where).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([]);

      // Act
      const result = await repository.findByLeaseIdAndMonth(
        'lease-789',
        new StatementMonth(2024, 3),
      );

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('existsByLeaseIdAndMonth', () => {
    it('should return true when LOS exists', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{ count: 1 }]);

      // Act
      const result = await repository.existsByLeaseIdAndMonth(
        'lease-789',
        new StatementMonth(2024, 3),
      );

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when LOS does not exist', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{ count: 0 }]);

      // Act
      const result = await repository.existsByLeaseIdAndMonth(
        'lease-789',
        new StatementMonth(2024, 3),
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getExpenseSummaryByLease', () => {
    it('should return expense summary grouped by lease', async () => {
      // Arrange
      const mockSummary = [
        {
          leaseId: 'lease-1',
          totalOperatingExpenses: 5000,
          totalCapitalExpenses: 2000,
          totalExpenses: 7000,
          statementCount: 3,
        },
        {
          leaseId: 'lease-2',
          totalOperatingExpenses: 3000,
          totalCapitalExpenses: 1000,
          totalExpenses: 4000,
          statementCount: 2,
        },
      ];
      mockQuery.mockResolvedValueOnce(mockSummary);

      // Act
      const result = await repository.getExpenseSummaryByLease(
        'org-456',
        new StatementMonth(2024, 1),
        new StatementMonth(2024, 3),
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].leaseId).toBe('lease-1');
      expect(result[0].totalExpenses).toBe(7000);
      expect(result[1].leaseId).toBe('lease-2');
      expect(result[1].totalExpenses).toBe(4000);
    });
  });

  describe('delete', () => {
    it('should delete LOS by ID', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce([{}]);

      // Act
      await repository.delete('los-123');

      // Assert
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalled();
    });
  });
});
