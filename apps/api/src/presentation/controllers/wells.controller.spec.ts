import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { WellsController } from './wells.controller';
import { CreateWellCommand } from '../../application/commands/create-well.command';
import { UpdateWellStatusCommand } from '../../application/commands/update-well-status.command';
import { GetWellByIdQuery } from '../../application/queries/get-well-by-id.query';
import { GetWellsByOperatorQuery } from '../../application/queries/get-wells-by-operator.query';
import { CreateWellDto } from '../../application/dtos/create-well.dto';
import { UpdateWellStatusDto } from '../../application/dtos/update-well-status.dto';
import { WellStatus, WellType } from '../../domain/enums/well-status.enum';
import { AbilitiesFactory } from '../../authorization/abilities.factory';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('WellsController', () => {
  let controller: WellsController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockAbilitiesFactory = {
    createForUser: jest.fn(),
    createForWellOperation: jest.fn(),
    createForGuest: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WellsController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AbilitiesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<WellsController>(WellsController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createWell', () => {
    it('should create a well successfully', async () => {
      const createWellDto: CreateWellDto = {
        name: 'Test Well #1',
        apiNumber: '4212312345',
        operatorId: 'op-123',
        wellType: WellType.OIL,
        location: {
          latitude: 32.7767,
          longitude: -96.7970,
          address: '123 Main St',
          county: 'Dallas County',
          state: 'TX',
          country: 'US',
        },
        spudDate: '2024-01-15',
        totalDepth: 8500,
        leaseId: 'lease-123',
      };

      const mockRequest = {
        user: { id: 'user-123' },
      };

      const expectedWellId = 'well-123';
      mockCommandBus.execute.mockResolvedValue(expectedWellId);

      const result = await controller.createWell(createWellDto, mockRequest);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateWellCommand)
      );
      expect(result).toEqual({
        id: expectedWellId,
        message: 'Well created successfully',
      });
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        apiNumber: 'invalid-api', // Invalid: wrong format
        operatorId: 'op-123',
        wellType: WellType.OIL,
        location: {
          latitude: 32.7767,
          longitude: -96.7970,
        },
      } as CreateWellDto;

      const mockRequest = {
        user: { id: 'user-123' },
      };

      mockCommandBus.execute.mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(controller.createWell(invalidDto, mockRequest)).rejects.toThrow(
        'Validation failed'
      );
    });

    it('should handle command execution errors', async () => {
      const createWellDto: CreateWellDto = {
        name: 'Test Well',
        apiNumber: '4212312345',
        operatorId: 'op-123',
        wellType: WellType.OIL,
        location: {
          latitude: 32.7767,
          longitude: -96.7970,
        },
        spudDate: '2024-01-15',
        totalDepth: 8500,
      };

      const mockRequest = {
        user: { id: 'user-123' },
      };

      mockCommandBus.execute.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.createWell(createWellDto, mockRequest)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getWellById', () => {
    it('should get well by ID successfully', async () => {
      const wellId = 'well-123';
      const expectedWell = {
        id: wellId,
        name: 'Test Well #1',
        apiNumber: '42-123-12345-00-00',
        operatorId: 'op-123',
        status: WellStatus.PRODUCING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQueryBus.execute.mockResolvedValue(expectedWell);

      const result = await controller.getWellById(wellId);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellByIdQuery)
      );
      expect(result).toEqual(expectedWell);
    });

    it('should handle well not found', async () => {
      const wellId = 'non-existent-well';

      mockQueryBus.execute.mockResolvedValue(null);

      const result = await controller.getWellById(wellId);

      expect(result).toBeNull();
    });

    it('should handle query execution errors', async () => {
      const wellId = 'well-123';

      mockQueryBus.execute.mockRejectedValue(
        new Error('Database query failed')
      );

      await expect(controller.getWellById(wellId)).rejects.toThrow(
        'Database query failed'
      );
    });
  });

  describe('getWellsByOperator', () => {
    it('should get wells by operator successfully', async () => {
      const operatorId = 'op-123';
      const expectedWells = [
        {
          id: 'well-1',
          name: 'Well #1',
          apiNumber: '4212312345',
          operatorId,
          status: WellStatus.PRODUCING,
        },
        {
          id: 'well-2',
          name: 'Well #2',
          apiNumber: '4212312346',
          operatorId,
          status: WellStatus.DRILLING,
        },
      ];

      const mockQueryResult = {
        wells: expectedWells,
        total: 2,
      };

      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      const result = await controller.getWellsByOperator(operatorId);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery)
      );
      expect(result).toEqual({
        wells: expectedWells,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle empty results', async () => {
      const operatorId = 'op-no-wells';

      const mockQueryResult = {
        wells: [],
        total: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      const result = await controller.getWellsByOperator(operatorId);

      expect(result).toEqual({
        wells: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should handle query with pagination', async () => {
      const operatorId = 'op-123';
      const page = 2;
      const limit = 5;

      const expectedWells = [
        {
          id: 'well-11',
          name: 'Well #11',
          operatorId,
          status: WellStatus.PRODUCING,
        },
      ];

      const mockQueryResult = {
        wells: expectedWells,
        total: 15,
      };

      mockQueryBus.execute.mockResolvedValue(mockQueryResult);

      const result = await controller.getWellsByOperator(operatorId, page, limit);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery)
      );
      expect(result).toEqual({
        wells: expectedWells,
        total: 15,
        page: 2,
        limit: 5,
        totalPages: 3,
      });
    });
  });

  describe('updateWellStatus', () => {
    it('should update well status successfully', async () => {
      const wellId = 'well-123';
      const updateDto: UpdateWellStatusDto = {
        status: WellStatus.COMPLETED,
        reason: 'Well completion finished',
      };

      const mockRequest = {
        user: { id: 'user-456' },
      };

      mockCommandBus.execute.mockResolvedValue(undefined);

      const result = await controller.updateWellStatus(wellId, updateDto, mockRequest);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateWellStatusCommand)
      );
      expect(result).toEqual({
        message: 'Well status updated successfully',
      });
    });

    it('should handle invalid status transitions', async () => {
      const wellId = 'well-123';
      const updateDto: UpdateWellStatusDto = {
        status: WellStatus.DRILLING, // Invalid: going back to drilling
        reason: 'Invalid transition',
      };

      const mockRequest = {
        user: { id: 'user-456' },
      };

      mockCommandBus.execute.mockRejectedValue(
        new Error('Invalid status transition')
      );

      await expect(
        controller.updateWellStatus(wellId, updateDto, mockRequest)
      ).rejects.toThrow('Invalid status transition');
    });

    it('should handle well not found for status update', async () => {
      const wellId = 'non-existent-well';
      const updateDto: UpdateWellStatusDto = {
        status: WellStatus.COMPLETED,
        reason: 'Update non-existent well',
      };

      const mockRequest = {
        user: { id: 'user-456' },
      };

      mockCommandBus.execute.mockRejectedValue(
        new Error('Well not found')
      );

      await expect(
        controller.updateWellStatus(wellId, updateDto, mockRequest)
      ).rejects.toThrow('Well not found');
    });
  });

  describe('error handling', () => {
    it('should handle command bus errors gracefully', async () => {
      const createWellDto: CreateWellDto = {
        name: 'Test Well',
        apiNumber: '4212312345',
        operatorId: 'op-123',
        wellType: WellType.OIL,
        location: { latitude: 32.7767, longitude: -96.7970 },
        spudDate: '2024-01-15',
        totalDepth: 8500,
      };

      const mockRequest = {
        user: { id: 'user-123' },
      };

      mockCommandBus.execute.mockRejectedValue(
        new Error('Internal server error')
      );

      await expect(controller.createWell(createWellDto, mockRequest)).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle query bus errors gracefully', async () => {
      const wellId = 'well-123';

      mockQueryBus.execute.mockRejectedValue(
        new Error('Query execution failed')
      );

      await expect(controller.getWellById(wellId)).rejects.toThrow(
        'Query execution failed'
      );
    });

    it('should handle timeout errors', async () => {
      const wellId = 'well-123';

      mockQueryBus.execute.mockRejectedValue(
        new Error('Request timeout')
      );

      await expect(controller.getWellById(wellId)).rejects.toThrow(
        'Request timeout'
      );
    });
  });

  describe('authorization integration', () => {
    it('should handle authorized requests', async () => {
      const wellId = 'well-123';
      const expectedWell = {
        id: wellId,
        name: 'Authorized Well',
        operatorId: 'op-123',
        status: WellStatus.PRODUCING,
      };

      mockQueryBus.execute.mockResolvedValue(expectedWell);

      const result = await controller.getWellById(wellId);

      expect(result).toEqual(expectedWell);
    });

    it('should handle unauthorized access attempts', async () => {
      const wellId = 'well-unauthorized';

      mockQueryBus.execute.mockRejectedValue(
        new Error('Unauthorized access')
      );

      await expect(controller.getWellById(wellId)).rejects.toThrow(
        'Unauthorized access'
      );
    });
  });
});
