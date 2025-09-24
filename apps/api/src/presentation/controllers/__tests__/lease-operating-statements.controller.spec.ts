import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { LeaseOperatingStatementsController } from '../lease-operating-statements.controller';
import { CreateLosCommand } from '../../../application/commands/create-los.command';
import { AddLosExpenseCommand } from '../../../application/commands/add-los-expense.command';
import { FinalizeLosCommand } from '../../../application/commands/finalize-los.command';
import { DistributeLosCommand } from '../../../application/commands/distribute-los.command';
import { GetLosByIdQuery } from '../../../application/queries/get-los-by-id.query';
import { GetLosByOrganizationQuery } from '../../../application/queries/get-los-by-organization.query';
import { GetLosByLeaseQuery } from '../../../application/queries/get-los-by-lease.query';
import { GetLosExpenseSummaryQuery } from '../../../application/queries/get-los-expense-summary.query';
import {
  CreateLosDto,
  AddExpenseDto,
  LosDto,
  LosListItemDto,
} from '../../../application/dtos/los.dto';
import {
  LosStatus,
  ExpenseCategory,
  ExpenseType,
} from '../../../domain/enums/los-status.enum';

describe('LeaseOperatingStatementsController', () => {
  let controller: LeaseOperatingStatementsController;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    organizationId: 'org-456',
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const mockCommand = {
      execute: jest.fn(),
    };

    const mockQuery = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaseOperatingStatementsController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommand,
        },
        {
          provide: QueryBus,
          useValue: mockQuery,
        },
      ],
    }).compile();

    controller = module.get<LeaseOperatingStatementsController>(
      LeaseOperatingStatementsController,
    );
    mockCommandBus = module.get(CommandBus);
    mockQueryBus = module.get(QueryBus);
  });

  describe('createLos', () => {
    it('should create LOS successfully', async () => {
      // Arrange
      const createLosDto: CreateLosDto = {
        leaseId: 'lease-789',
        year: 2024,
        month: 3,
        notes: 'Test LOS',
      };
      const expectedLosId = 'los-123';
      mockCommandBus.execute.mockResolvedValue(expectedLosId);

      // Act
      const result = await controller.createLos(createLosDto, mockRequest);

      // Assert
      expect(result).toEqual({
        id: expectedLosId,
        message: 'Lease Operating Statement created successfully',
      });
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateLosCommand),
      );
    });

    it('should create command with correct parameters', async () => {
      // Arrange
      const createLosDto: CreateLosDto = {
        leaseId: 'lease-789',
        year: 2024,
        month: 3,
        notes: 'Test LOS',
      };
      mockCommandBus.execute.mockResolvedValue('los-123');

      // Act
      await controller.createLos(createLosDto, mockRequest);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          leaseId: 'lease-789',
          year: 2024,
          month: 3,
          notes: 'Test LOS',
          createdBy: 'user-123',
        }),
      );
    });
  });

  describe('getLosStatements', () => {
    it('should get LOS statements for organization', async () => {
      // Arrange
      const mockLosStatements: LosListItemDto[] = [
        {
          id: 'los-1',
          leaseId: 'lease-789',
          leaseName: 'Test Lease',
          statementMonth: '2024-03',
          displayMonth: 'March 2024',
          totalExpenses: 1000,
          status: LosStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockQueryBus.execute.mockResolvedValue(mockLosStatements);

      // Act
      const result = await controller.getLosStatements(mockRequest);

      // Assert
      expect(result).toBe(mockLosStatements);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetLosByOrganizationQuery),
      );
    });

    it('should pass query parameters correctly', async () => {
      // Arrange
      mockQueryBus.execute.mockResolvedValue([]);

      // Act
      await controller.getLosStatements(mockRequest, LosStatus.DRAFT, 10, 0);

      // Assert
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          status: LosStatus.DRAFT,
          limit: 10,
          offset: 0,
        }),
      );
    });
  });

  describe('getLosByLease', () => {
    it('should get LOS statements for specific lease', async () => {
      // Arrange
      const mockLosStatements: LosListItemDto[] = [];
      mockQueryBus.execute.mockResolvedValue(mockLosStatements);

      // Act
      const result = await controller.getLosByLease('lease-789');

      // Assert
      expect(result).toBe(mockLosStatements);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetLosByLeaseQuery),
      );
    });
  });

  describe('getLosById', () => {
    it('should get LOS by ID', async () => {
      // Arrange
      const mockLos: LosDto = {
        id: 'los-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        leaseName: 'Test Lease',
        statementMonth: '2024-03',
        displayMonth: 'March 2024',
        totalExpenses: 1000,
        operatingExpenses: 800,
        capitalExpenses: 200,
        status: LosStatus.DRAFT,
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
        expenseLineItems: [],
      };
      mockQueryBus.execute.mockResolvedValue(mockLos);

      // Act
      const result = await controller.getLosById('los-123');

      // Assert
      expect(result).toBe(mockLos);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetLosByIdQuery),
      );
    });
  });

  describe('addExpense', () => {
    it('should add expense to LOS successfully', async () => {
      // Arrange
      const addExpenseDto: AddExpenseDto = {
        description: 'Test expense',
        category: ExpenseCategory.UTILITIES,
        type: ExpenseType.OPERATING,
        amount: 1000,
        currency: 'USD',
        vendorName: 'Test Vendor',
        invoiceNumber: 'INV-123',
        notes: 'Test notes',
      };
      const expectedExpenseId = 'expense-123';
      mockCommandBus.execute.mockResolvedValue(expectedExpenseId);

      // Act
      const result = await controller.addExpense(
        'los-123',
        addExpenseDto,
        mockRequest,
      );

      // Assert
      expect(result).toEqual({
        expenseId: expectedExpenseId,
        message: 'Expense added successfully',
      });
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(AddLosExpenseCommand),
      );
    });

    it('should create command with correct parameters', async () => {
      // Arrange
      const addExpenseDto: AddExpenseDto = {
        description: 'Test expense',
        category: ExpenseCategory.UTILITIES,
        type: ExpenseType.OPERATING,
        amount: 1000,
        vendorName: 'Test Vendor',
      };
      mockCommandBus.execute.mockResolvedValue('expense-123');

      // Act
      await controller.addExpense('los-123', addExpenseDto, mockRequest);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          losId: 'los-123',
          description: 'Test expense',
          category: ExpenseCategory.UTILITIES,
          type: ExpenseType.OPERATING,
          amount: 1000,
          currency: 'USD', // Default currency
          vendorName: 'Test Vendor',
          addedBy: 'user-123',
        }),
      );
    });
  });

  describe('finalizeLos', () => {
    it('should finalize LOS successfully', async () => {
      // Arrange
      mockCommandBus.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.finalizeLos('los-123', mockRequest);

      // Assert
      expect(result).toEqual({
        message: 'LOS finalized successfully',
      });
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(FinalizeLosCommand),
      );
    });

    it('should create command with correct parameters', async () => {
      // Arrange
      mockCommandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.finalizeLos('los-123', mockRequest);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          losId: 'los-123',
          finalizedBy: 'user-123',
        }),
      );
    });
  });

  describe('distributeLos', () => {
    it('should distribute LOS successfully', async () => {
      // Arrange
      mockCommandBus.execute.mockResolvedValue(undefined);

      // Act
      const result = await controller.distributeLos('los-123', mockRequest);

      // Assert
      expect(result).toEqual({
        message: 'LOS distributed successfully',
      });
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(DistributeLosCommand),
      );
    });

    it('should create command with correct parameters', async () => {
      // Arrange
      mockCommandBus.execute.mockResolvedValue(undefined);

      // Act
      await controller.distributeLos('los-123', mockRequest);

      // Assert
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          losId: 'los-123',
          distributedBy: 'user-123',
          method: 'email',
          retryAttempts: 1,
        }),
      );
    });
  });

  describe('getExpenseSummary', () => {
    it('should get expense summary successfully', async () => {
      // Arrange
      const mockSummary = [
        {
          leaseId: 'lease-1',
          totalOperatingExpenses: 5000,
          totalCapitalExpenses: 2000,
          totalExpenses: 7000,
          statementCount: 3,
        },
      ];
      mockQueryBus.execute.mockResolvedValue(mockSummary);

      // Act
      const result = await controller.getExpenseSummary(
        mockRequest,
        2024,
        1,
        2024,
        3,
      );

      // Assert
      expect(result).toBe(mockSummary);
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(GetLosExpenseSummaryQuery),
      );
    });

    it('should create query with correct parameters', async () => {
      // Arrange
      mockQueryBus.execute.mockResolvedValue([]);

      // Act
      await controller.getExpenseSummary(mockRequest, 2024, 1, 2024, 3);

      // Assert
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-456',
          startYear: 2024,
          startMonth: 1,
          endYear: 2024,
          endMonth: 3,
        }),
      );
    });
  });
});
