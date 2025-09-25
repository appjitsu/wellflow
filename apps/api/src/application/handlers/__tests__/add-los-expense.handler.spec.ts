import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AddLosExpenseHandler } from '../add-los-expense.handler';
import { AddLosExpenseCommand } from '../../commands/add-los-expense.command';
import {
  ExpenseCategory,
  ExpenseType,
} from '../../../domain/enums/los-status.enum';
import { ExpenseLineItem } from '../../../domain/value-objects/expense-line-item';

// Mock the repository interface
const mockLosRepository = {
  findById: jest.fn(),
  save: jest.fn(),
};

// Mock EventBus
const mockEventBus = {
  publish: jest.fn(),
};

describe('AddLosExpenseHandler', () => {
  let handler: AddLosExpenseHandler;

  const mockLos = {
    addExpenseLineItem: jest.fn(),
    getDomainEvents: jest.fn(),
    clearDomainEvents: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddLosExpenseHandler,
        {
          provide: 'LosRepository',
          useValue: mockLosRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<AddLosExpenseHandler>(AddLosExpenseHandler);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand = new AddLosExpenseCommand(
      'los-123',
      'Drilling supplies',
      ExpenseCategory.SUPPLIES,
      ExpenseType.OPERATING,
      5000.0,
      'USD',
      'ABC Drilling Co',
      'INV-001',
      new Date('2024-01-15'),
      'Monthly drilling supplies',
      'user-456',
    );

    it('should successfully add expense to LOS', async () => {
      // Arrange
      const mockEvents = [{ type: 'ExpenseAddedEvent' }];
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLos.getDomainEvents.mockReturnValue(mockEvents);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(mockLosRepository.findById).toHaveBeenCalledWith('los-123');
      expect(mockLos.addExpenseLineItem).toHaveBeenCalledTimes(1);
      expect(mockLosRepository.save).toHaveBeenCalledWith(mockLos);
      expect(mockEventBus.publish).toHaveBeenCalledWith(mockEvents[0]);
      expect(mockLos.clearDomainEvents).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should create expense with correct parameters', async () => {
      // Arrange
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockLos.addExpenseLineItem).toHaveBeenCalledTimes(1);
      const [expenseItem, addedBy] = mockLos.addExpenseLineItem.mock.calls[0];

      expect(expenseItem).toBeInstanceOf(ExpenseLineItem);
      expect(addedBy).toBe('user-456');
    });

    it('should use default addedBy when not provided', async () => {
      // Arrange
      const commandWithoutUser = new AddLosExpenseCommand(
        'los-123',
        'Drilling supplies',
        ExpenseCategory.SUPPLIES,
        ExpenseType.OPERATING,
        5000.0,
        'USD',
      );
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(commandWithoutUser);

      // Assert
      const [, addedBy] = mockLos.addExpenseLineItem.mock.calls[0];
      expect(addedBy).toBe('system');
    });

    it('should use default currency when not provided', async () => {
      // Arrange
      const commandWithoutCurrency = new AddLosExpenseCommand(
        'los-123',
        'Drilling supplies',
        ExpenseCategory.SUPPLIES,
        ExpenseType.OPERATING,
        5000.0,
      );
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(commandWithoutCurrency);

      // Assert
      expect(mockLos.addExpenseLineItem).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when LOS not found', async () => {
      // Arrange
      mockLosRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Lease Operating Statement with ID los-123 not found',
      );
    });

    it('should throw BadRequestException for negative amount', async () => {
      // Arrange
      const invalidCommand = new AddLosExpenseCommand(
        'los-123',
        'Invalid expense',
        ExpenseCategory.SUPPLIES,
        ExpenseType.OPERATING,
        -100.0,
      );
      mockLosRepository.findById.mockResolvedValue(mockLos);

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        'Expense amount cannot be negative',
      );
    });

    it('should allow zero amount', async () => {
      // Arrange
      const zeroCommand = new AddLosExpenseCommand(
        'los-123',
        'Zero expense',
        ExpenseCategory.SUPPLIES,
        ExpenseType.OPERATING,
        0,
      );
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act
      const result = await handler.execute(zeroCommand);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const saveError = new Error('Database connection failed');
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLosRepository.save.mockRejectedValue(saveError);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to add expense to Lease Operating Statement: Database connection failed',
      );
    });

    it('should publish all domain events', async () => {
      // Arrange
      const mockEvents = [
        { type: 'ExpenseAddedEvent', expenseId: 'exp-1' },
        { type: 'LosUpdatedEvent', losId: 'los-123' },
      ];
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLosRepository.save.mockResolvedValue(undefined);
      mockLos.getDomainEvents.mockReturnValue(mockEvents);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publish).toHaveBeenCalledWith(mockEvents[0]);
      expect(mockEventBus.publish).toHaveBeenCalledWith(mockEvents[1]);
      expect(mockLos.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle LOS with no domain events', async () => {
      // Arrange
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLosRepository.save.mockResolvedValue(undefined);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(mockEventBus.publish).not.toHaveBeenCalled();
      expect(mockLos.clearDomainEvents).toHaveBeenCalled();
    });

    it('should create expense with all optional fields', async () => {
      // Arrange
      const commandWithAllFields = new AddLosExpenseCommand(
        'los-123',
        'Complete drilling expense',
        ExpenseCategory.DRILLING,
        ExpenseType.CAPITAL,
        7500.5,
        'CAD',
        'Premium Drilling Ltd',
        'INV-2024-001',
        new Date('2024-01-20'),
        'Complete drilling operation with premium equipment',
        'operator-789',
      );
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLosRepository.save.mockResolvedValue(undefined);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(commandWithAllFields);

      // Assert
      expect(mockLos.addExpenseLineItem).toHaveBeenCalledTimes(1);
      const [, addedBy] = mockLos.addExpenseLineItem.mock.calls[0];
      expect(addedBy).toBe('operator-789');
    });

    it('should create expense with minimal required fields', async () => {
      // Arrange
      const minimalCommand = new AddLosExpenseCommand(
        'los-123',
        'Basic expense',
        ExpenseCategory.LABOR,
        ExpenseType.OPERATING,
        100.0,
      );
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLosRepository.save.mockResolvedValue(undefined);
      mockLos.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(minimalCommand);

      // Assert
      expect(mockLos.addExpenseLineItem).toHaveBeenCalledTimes(1);
      const [, addedBy] = mockLos.addExpenseLineItem.mock.calls[0];
      expect(addedBy).toBe('system');
    });

    it('should re-throw NotFoundException from repository', async () => {
      // Arrange
      const notFoundError = new NotFoundException('LOS not found');
      mockLosRepository.findById.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLosRepository.save).not.toHaveBeenCalled();
    });

    it('should re-throw BadRequestException from LOS operations', async () => {
      // Arrange
      const badRequestError = new BadRequestException('Invalid expense data');
      mockLosRepository.findById.mockResolvedValue(mockLos);
      mockLos.addExpenseLineItem.mockImplementation(() => {
        throw badRequestError;
      });

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockLosRepository.save).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected database error');
      mockLosRepository.findById.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to add expense to Lease Operating Statement: Unexpected database error',
      );
    });

    it('should handle non-Error objects in error messages', async () => {
      // Arrange
      mockLosRepository.findById.mockRejectedValue('String error');

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to add expense to Lease Operating Statement: Unknown error',
      );
    });
  });
});
