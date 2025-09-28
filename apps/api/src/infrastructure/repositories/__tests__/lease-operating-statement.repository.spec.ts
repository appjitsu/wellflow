// Mock drizzle-orm before any imports
jest.doMock('drizzle-orm', () => {
  const actual = jest.requireActual('drizzle-orm');
  return {
    ...actual,
    relations: jest.fn(() => ({})),
  };
});

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
import { DatabaseService } from '../../../database/database.service';

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value })),
  and: jest.fn((...conditions) => ({ conditions })),
  gte: jest.fn((field, value) => ({ field, value })),
  lte: jest.fn((field, value) => ({ field, value })),
  desc: jest.fn((field) => ({ field, direction: 'desc' })),
  count: jest.fn(() => ({ count: true })),
  sql: jest.fn(),
}));

// Create a mock query builder that supports chaining and is awaitable
const createMockQueryBuilder = (result: any = []) => {
  const methods = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockResolvedValue(result),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockResolvedValue(result),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
  };

  // Create a promise that resolves to the result and has the query methods
  const promise = Promise.resolve(result);
  return Object.assign(promise, methods);
};

// Mock database connection
const createMockDb = () => {
  const mockQueryBuilder = createMockQueryBuilder();

  return {
    select: jest.fn(() => mockQueryBuilder),
    insert: jest.fn(() => mockQueryBuilder),
    update: jest.fn(() => mockQueryBuilder),
    delete: jest.fn(() => mockQueryBuilder),
  } as any; // Cast to any to avoid type issues with complex Drizzle types
};

describe('LosRepository', () => {
  let repository: LosRepository;
  let mockLos: LeaseOperatingStatement;
  let mockDb: any;
  let mockDatabaseService: { getDb: jest.Mock };

  beforeEach(async () => {
    mockDb = createMockDb();

    // Mock DatabaseService
    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LosRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<LosRepository>(LosRepository);

    // Verify repository is properly instantiated
    expect(repository).toBeDefined();

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

    // Reset all mocks - clear any previous mockResolvedValueOnce calls
    jest.clearAllMocks();
    // Reset mock implementations to defaults
    mockDb.select.mockClear();
    mockDb.insert.mockClear();
    mockDb.update.mockClear();
    mockDb.delete.mockClear();
  });

  describe('save', () => {
    it('should insert new LOS when it does not exist', async () => {
      // Arrange
      const selectQuery = mockDb.select();
      const insertQuery = mockDb.insert();
      selectQuery.limit.mockResolvedValue([]); // findById returns empty array
      insertQuery.returning.mockResolvedValue([{}]); // insert returns success

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
      const selectQuery = mockDb.select();
      const updateQuery = mockDb.update();
      selectQuery.limit.mockResolvedValue([existingRecord]); // findById returns existing
      updateQuery.returning.mockResolvedValue([{}]); // update returns success

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
      // Arrange - Create fresh mock for this test
      const mockRecord = {
        id: 'los-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        statementMonth: '2024-03', // Should be YYYY-MM string format
        totalExpenses: '1000', // Should be string
        operatingExpenses: '1000', // Should be string
        capitalExpenses: '0', // Should be string
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
            amount: { amount: 1000, currency: 'USD' },
          },
        ]),
      };
      const testMockDb = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([mockRecord]),
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue([]),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };
      const testDatabaseService = {
        getDb: jest.fn().mockReturnValue(testMockDb),
      };
      const testRepository = new LosRepository(testDatabaseService as any);

      // Act
      const result = await testRepository.findById('los-123');

      // Assert
      expect(result).toBeInstanceOf(LeaseOperatingStatement);
      expect(result?.getId()).toBe('los-123');
      expect(result?.getOrganizationId()).toBe('org-456');
      expect(result?.getLeaseId()).toBe('lease-789');
      expect(result?.getTotalExpenses()).toBe(1000);
    });

    it('should return null when not found', async () => {
      // Arrange - Create fresh mock for this test
      const testMockDb = {
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue([]),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      };
      const testDatabaseService = {
        getDb: jest.fn().mockReturnValue(testMockDb),
      };
      const testRepository = new LosRepository(testDatabaseService as any);

      // Act
      const result = await testRepository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByOrganizationId', () => {
    it('should return LOS list for organization', async () => {
      // Arrange
      const mockRecords = [
        {
          id: 'los-123',
          organizationId: 'org-456',
          leaseId: 'lease-789',
          statementMonth: new Date('2024-03-01'),
          totalExpenses: 1000,
          operatingExpenses: 800,
          capitalExpenses: 200,
          status: LosStatus.DRAFT,
          notes: 'Test LOS',
          createdAt: new Date(),
          updatedAt: new Date(),
          expenseBreakdown: '[]',
        },
      ];
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockRecords),
          }),
        }),
      });

      // Act
      const result = await repository.findByOrganizationId('org-456');

      // Assert
      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LeaseOperatingStatement);
    });

    it('should apply status filter when provided', async () => {
      // Arrange
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      const result = await repository.findByOrganizationId('org-456', {
        status: LosStatus.FINALIZED,
      });

      // Assert
      expect(result).toEqual([]);
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
      const selectQuery = mockDb.select();
      selectQuery.limit.mockResolvedValue([mockRecord]);

      // Act
      const result = await repository.findByLeaseIdAndMonth(
        'lease-789',
        new StatementMonth(2024, 3),
      );

      // Assert
      expect(result).toBeInstanceOf(LeaseOperatingStatement);
      expect(result?.getId()).toBe('los-123');
      expect(selectQuery.where).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      // Arrange
      const selectQuery = mockDb.select();
      selectQuery.limit.mockResolvedValue([]);

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
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });

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
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

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
          leaseId: 'lease-789',
          totalExpenses: 1000,
          operatingExpenses: 800,
          capitalExpenses: 200,
        },
      ];
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue(mockSummary),
          }),
        }),
      });

      // Act
      const result = await repository.getExpenseSummaryByLease(
        'org-456',
        new StatementMonth(2024, 1),
        new StatementMonth(2024, 12),
      );

      // Assert
      expect(result).toEqual(mockSummary);
    });
  });

  describe('delete', () => {
    it('should delete LOS by ID', async () => {
      // Arrange
      const deleteQuery = mockDb.delete();
      deleteQuery.returning.mockResolvedValue([{}]);

      // Act
      await repository.delete('los-123');

      // Assert
      expect(mockDb.delete).toHaveBeenCalled();
      expect(deleteQuery.where).toHaveBeenCalled();
    });
  });
});
