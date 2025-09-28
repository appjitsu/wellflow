import { Test, TestingModule } from '@nestjs/testing';
import { CreateCurativeItemHandler } from '../create-curative-item.handler';
import { CreateCurativeItemCommand } from '../../commands/create-curative-item.command';
import { CurativeItemRepository } from '../../../domain/repositories/curative-item.repository.interface';
import {
  CurativeItem,
  CurativePriority,
  CurativeStatus,
} from '../../../domain/entities/curative-item.entity';
import { randomUUID } from 'crypto';

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>;

// Mock CurativeItem
jest.mock('../../../domain/entities/curative-item.entity');
const MockCurativeItem = CurativeItem as jest.MockedClass<typeof CurativeItem>;

describe('CreateCurativeItemHandler', () => {
  let handler: CreateCurativeItemHandler;
  let curativeItemRepository: jest.Mocked<CurativeItemRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRandomUUID.mockReturnValue('curative-123');

    const mockCurativeItemRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTitleOpinion: jest.fn(),
      findByOrganization: jest.fn(),
      findByStatus: jest.fn(),
      findByAssignedTo: jest.fn(),
      updateStatus: jest.fn(),
      updateAssignment: jest.fn(),
      updateDueDate: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCurativeItemHandler,
        {
          provide: 'CurativeItemRepository',
          useValue: mockCurativeItemRepository,
        },
      ],
    }).compile();

    handler = module.get<CreateCurativeItemHandler>(CreateCurativeItemHandler);
    curativeItemRepository = module.get('CurativeItemRepository');
  });

  describe('execute', () => {
    const validCommand = new CreateCurativeItemCommand(
      'title-opinion-123',
      'org-456',
      'CI-001',
      'Title Defect',
      'Missing mineral rights description',
      'high',
      'user-789',
      new Date('2024-03-01'),
      CurativeStatus.OPEN,
    );

    it('should successfully create a curative item', async () => {
      // Arrange
      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      curativeItemRepository.save.mockResolvedValue(mockItem as any);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBe('curative-123');
      expect(MockCurativeItem).toHaveBeenCalledWith({
        id: 'curative-123',
        titleOpinionId: 'title-opinion-123',
        itemNumber: 'CI-001',
        defectType: 'Title Defect',
        description: 'Missing mineral rights description',
        priority: 'high',
        status: CurativeStatus.OPEN,
        assignedTo: 'user-789',
        dueDate: new Date('2024-03-01'),
      });
      expect(curativeItemRepository.save).toHaveBeenCalledWith(
        mockItem,
        'org-456',
      );
    });

    it('should create item with minimal required fields', async () => {
      // Arrange
      const minimalCommand = new CreateCurativeItemCommand(
        'title-opinion-123',
        'org-456',
        'CI-002',
        'Basic Defect',
        'Simple description',
        'medium',
      );

      mockRandomUUID.mockReturnValue('curative-456');
      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-456'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      curativeItemRepository.save.mockResolvedValue(mockItem as any);

      // Act
      const result = await handler.execute(minimalCommand);

      // Assert
      expect(result).toBe('curative-456');
      expect(MockCurativeItem).toHaveBeenCalledWith({
        id: 'curative-456',
        titleOpinionId: 'title-opinion-123',
        itemNumber: 'CI-002',
        defectType: 'Basic Defect',
        description: 'Simple description',
        priority: 'medium',
        status: undefined,
        assignedTo: undefined,
        dueDate: undefined,
      });
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      const repositoryError = new Error('Database connection failed');
      curativeItemRepository.save.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );

      expect(curativeItemRepository.save).toHaveBeenCalledWith(
        mockItem,
        'org-456',
      );
    });

    it('should generate unique item IDs', async () => {
      // Arrange
      const command1 = new CreateCurativeItemCommand(
        'title-opinion-123',
        'org-456',
        'CI-001',
        'Defect 1',
        'Description 1',
        'high',
      );

      const command2 = new CreateCurativeItemCommand(
        'title-opinion-456',
        'org-789',
        'CI-002',
        'Defect 2',
        'Description 2',
        'low',
      );

      const mockItem1 = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      const mockItem2 = {
        getId: jest.fn().mockReturnValue('curative-456'),
      };

      MockCurativeItem.mockImplementationOnce(
        () => mockItem1 as any,
      ).mockImplementationOnce(() => mockItem2 as any);

      curativeItemRepository.save
        .mockResolvedValueOnce(mockItem1 as any)
        .mockResolvedValueOnce(mockItem2 as any);

      mockRandomUUID
        .mockReturnValueOnce('curative-123')
        .mockReturnValueOnce('curative-456');

      // Act
      const result1 = await handler.execute(command1);
      const result2 = await handler.execute(command2);

      // Assert
      expect(result1).toBe('curative-123');
      expect(result2).toBe('curative-456');
      expect(result1).not.toBe(result2);
    });

    it('should handle different priorities', async () => {
      // Arrange
      const priorities: CurativePriority[] = ['low', 'medium', 'high'];

      for (const priority of priorities) {
        const command = new CreateCurativeItemCommand(
          'title-opinion-123',
          'org-456',
          'CI-TEST',
          'Test Defect',
          'Test description',
          priority,
        );

        const mockItem = {
          getId: jest.fn().mockReturnValue('curative-test'),
        };
        MockCurativeItem.mockImplementation(() => mockItem as any);
        curativeItemRepository.save.mockResolvedValue(mockItem as any);

        const result = await handler.execute(command);
        expect(result).toBe('curative-test');
      }
    });

    it('should handle different statuses', async () => {
      // Arrange
      const statuses = [
        CurativeStatus.OPEN,
        CurativeStatus.IN_PROGRESS,
        CurativeStatus.RESOLVED,
        CurativeStatus.WAIVED,
      ];

      for (const status of statuses) {
        const command = new CreateCurativeItemCommand(
          'title-opinion-123',
          'org-456',
          'CI-TEST',
          'Test Defect',
          'Test description',
          'medium',
          undefined,
          undefined,
          status,
        );

        const mockItem = {
          getId: jest.fn().mockReturnValue('curative-test'),
        };
        MockCurativeItem.mockImplementation(() => mockItem as any);
        curativeItemRepository.save.mockResolvedValue(mockItem as any);

        const result = await handler.execute(command);
        expect(result).toBe('curative-test');
        expect(MockCurativeItem).toHaveBeenCalledWith(
          expect.objectContaining({ status }),
        );
      }
    });

    it('should handle different organization IDs', async () => {
      // Arrange
      const testCases = [
        'org-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-org',
        'org_with_underscores',
        'org-with-dashes',
      ];

      for (const orgId of testCases) {
        const command = new CreateCurativeItemCommand(
          'title-opinion-123',
          orgId,
          'CI-TEST',
          'Test Defect',
          'Test description',
          'medium',
        );

        const mockItem = {
          getId: jest.fn().mockReturnValue('curative-test'),
        };
        MockCurativeItem.mockImplementation(() => mockItem as any);
        curativeItemRepository.save.mockResolvedValue(mockItem as any);

        const result = await handler.execute(command);
        expect(result).toBe('curative-test');
        expect(curativeItemRepository.save).toHaveBeenCalledWith(
          mockItem,
          orgId,
        );
      }
    });

    it('should handle empty optional fields', async () => {
      // Arrange
      const commandWithEmptyOptionals = new CreateCurativeItemCommand(
        'title-opinion-123',
        'org-456',
        'CI-001',
        'Defect',
        'Description',
        'medium',
        '', // empty assignedTo
        undefined, // undefined dueDate
        undefined, // undefined status
      );

      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      curativeItemRepository.save.mockResolvedValue(mockItem as any);

      // Act
      const result = await handler.execute(commandWithEmptyOptionals);

      // Assert
      expect(result).toBe('curative-123');
      expect(MockCurativeItem).toHaveBeenCalledWith({
        id: 'curative-123',
        titleOpinionId: 'title-opinion-123',
        itemNumber: 'CI-001',
        defectType: 'Defect',
        description: 'Description',
        priority: 'medium',
        status: undefined,
        assignedTo: '',
        dueDate: undefined,
      });
    });

    it('should handle null optional fields', async () => {
      // Arrange
      const commandWithNullOptionals = new CreateCurativeItemCommand(
        'title-opinion-123',
        'org-456',
        'CI-001',
        'Defect',
        'Description',
        'medium',
        null as any, // null assignedTo
        null as any, // null dueDate
        null as any, // null status
      );

      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      curativeItemRepository.save.mockResolvedValue(mockItem as any);

      // Act
      const result = await handler.execute(commandWithNullOptionals);

      // Assert
      expect(result).toBe('curative-123');
      expect(MockCurativeItem).toHaveBeenCalledWith({
        id: 'curative-123',
        titleOpinionId: 'title-opinion-123',
        itemNumber: 'CI-001',
        defectType: 'Defect',
        description: 'Description',
        priority: 'medium',
        status: null,
        assignedTo: null,
        dueDate: null,
      });
    });

    it('should handle undefined optional fields', async () => {
      // Arrange
      const commandWithUndefinedOptionals = new CreateCurativeItemCommand(
        'title-opinion-123',
        'org-456',
        'CI-001',
        'Defect',
        'Description',
        'medium',
        undefined,
        undefined,
        undefined,
      );

      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      curativeItemRepository.save.mockResolvedValue(mockItem as any);

      // Act
      const result = await handler.execute(commandWithUndefinedOptionals);

      // Assert
      expect(result).toBe('curative-123');
      expect(MockCurativeItem).toHaveBeenCalledWith({
        id: 'curative-123',
        titleOpinionId: 'title-opinion-123',
        itemNumber: 'CI-001',
        defectType: 'Defect',
        description: 'Description',
        priority: 'medium',
        status: undefined,
        assignedTo: undefined,
        dueDate: undefined,
      });
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      curativeItemRepository.save.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(validCommand);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(curativeItemRepository.save).toHaveBeenCalledWith(
        mockItem,
        'org-456',
      );
    });

    it('should create item with past due date', async () => {
      // Arrange
      const pastDueCommand = new CreateCurativeItemCommand(
        'title-opinion-123',
        'org-456',
        'CI-001',
        'Defect',
        'Description',
        'high',
        'user-123',
        new Date('2020-01-01'), // Past date
        CurativeStatus.OPEN,
      );

      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      curativeItemRepository.save.mockResolvedValue(mockItem as any);

      // Act
      const result = await handler.execute(pastDueCommand);

      // Assert
      expect(result).toBe('curative-123');
      expect(MockCurativeItem).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: new Date('2020-01-01'),
        }),
      );
    });

    it('should create item with future due date', async () => {
      // Arrange
      const futureDueCommand = new CreateCurativeItemCommand(
        'title-opinion-123',
        'org-456',
        'CI-001',
        'Defect',
        'Description',
        'high',
        'user-123',
        new Date('2025-12-31'), // Future date
        CurativeStatus.OPEN,
      );

      const mockItem = {
        getId: jest.fn().mockReturnValue('curative-123'),
      };
      MockCurativeItem.mockImplementation(() => mockItem as any);
      curativeItemRepository.save.mockResolvedValue(mockItem as any);

      // Act
      const result = await handler.execute(futureDueCommand);

      // Assert
      expect(result).toBe('curative-123');
      expect(MockCurativeItem).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: new Date('2025-12-31'),
        }),
      );
    });
  });
});
