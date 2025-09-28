import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { OperatorsController } from '../operators.controller';
import { GetWellsByOperatorQuery } from '../../../application/queries/get-wells-by-operator.query';
import { WellDto } from '../../../application/dtos/well.dto';
import { WellStatus, WellType } from '../../../domain/enums/well-status.enum';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { Reflector } from '@nestjs/core';
import { AbilitiesFactory } from '../../../authorization/abilities.factory';

describe('OperatorsController', () => {
  let controller: OperatorsController;
  let queryBus: QueryBus;

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockAbilitiesGuard = {
    canActivate: jest.fn(() => true),
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
      controllers: [OperatorsController],
      providers: [
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
      .useValue(mockJwtAuthGuard)
      .overrideGuard(AbilitiesGuard)
      .useValue(mockAbilitiesGuard)
      .compile();

    controller = module.get<OperatorsController>(OperatorsController);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWellsByOperator', () => {
    it('should return wells by operator with default pagination', async () => {
      const operatorId = 'operator-123';
      const mockWells: WellDto[] = [
        {
          id: 'well-1',
          name: 'Well #1',
          apiNumber: '4212312345',
          operatorId,
          wellType: WellType.OIL,
          status: WellStatus.ACTIVE,
          location: {
            coordinates: {
              latitude: 32.7767,
              longitude: -96.797,
            },
            address: '123 Main St',
            county: 'Dallas',
            state: 'TX',
            country: 'US',
          },
          spudDate: new Date('2024-01-15'),
          totalDepth: 8500,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          version: 1,
        },
      ];

      const mockResult = {
        wells: mockWells,
        total: 1,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(operatorId);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery),
      );
      expect(result).toEqual({
        wells: mockWells,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return wells by operator with custom pagination', async () => {
      const operatorId = 'operator-123';
      const page = 2;
      const limit = 5;
      const mockWells: WellDto[] = [
        {
          id: 'well-6',
          name: 'Well #6',
          apiNumber: '4212312346',
          operatorId,
          wellType: WellType.GAS,
          status: WellStatus.COMPLETED,
          location: {
            coordinates: {
              latitude: 32.7767,
              longitude: -96.797,
            },
            address: '456 Oak St',
            county: 'Dallas',
            state: 'TX',
            country: 'US',
          },
          spudDate: new Date('2024-02-01'),
          totalDepth: 9200,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-02-15'),
          version: 1,
        },
      ];

      const mockResult = {
        wells: mockWells,
        total: 12,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        page,
        limit,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery),
      );
      expect(result).toEqual({
        wells: mockWells,
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3, // Math.ceil(12 / 5) = 3
      });
    });

    it('should return wells by operator with status filter', async () => {
      const operatorId = 'operator-123';
      const status = 'ACTIVE';
      const mockWells: WellDto[] = [
        {
          id: 'well-1',
          name: 'Active Well #1',
          apiNumber: '4212312345',
          operatorId,
          wellType: WellType.OIL,
          status: WellStatus.ACTIVE,
          location: {
            coordinates: {
              latitude: 32.7767,
              longitude: -96.797,
            },
            address: '123 Main St',
            county: 'Dallas',
            state: 'TX',
            country: 'US',
          },
          spudDate: new Date('2024-01-15'),
          totalDepth: 8500,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          version: 1,
        },
      ];

      const mockResult = {
        wells: mockWells,
        total: 3,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        1,
        10,
        status,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery),
      );
      expect(result).toEqual({
        wells: mockWells,
        total: 3,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return wells by operator with well type filter', async () => {
      const operatorId = 'operator-123';
      const wellType = 'GAS';
      const mockWells: WellDto[] = [
        {
          id: 'well-2',
          name: 'Gas Well #1',
          apiNumber: '4212312346',
          operatorId,
          wellType: WellType.GAS,
          status: WellStatus.ACTIVE,
          location: {
            coordinates: {
              latitude: 32.7767,
              longitude: -96.797,
            },
            address: '456 Oak St',
            county: 'Dallas',
            state: 'TX',
            country: 'US',
          },
          spudDate: new Date('2024-01-20'),
          totalDepth: 7800,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-20'),
          version: 1,
        },
      ];

      const mockResult = {
        wells: mockWells,
        total: 2,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        1,
        10,
        undefined,
        wellType,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery),
      );
      expect(result).toEqual({
        wells: mockWells,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should return wells by operator with both status and well type filters', async () => {
      const operatorId = 'operator-123';
      const status = 'COMPLETED';
      const wellType = 'OIL';
      const mockWells: WellDto[] = [
        {
          id: 'well-3',
          name: 'Completed Oil Well #1',
          apiNumber: '4212312347',
          operatorId,
          wellType: WellType.OIL,
          status: WellStatus.COMPLETED,
          location: {
            coordinates: {
              latitude: 32.7767,
              longitude: -96.797,
            },
            address: '789 Pine St',
            county: 'Dallas',
            state: 'TX',
            country: 'US',
          },
          spudDate: new Date('2024-01-10'),
          totalDepth: 9200,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-02-01'),
          version: 1,
        },
      ];

      const mockResult = {
        wells: mockWells,
        total: 1,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        1,
        10,
        status,
        wellType,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery),
      );
      expect(result).toEqual({
        wells: mockWells,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle empty results', async () => {
      const operatorId = 'operator-123';
      const mockResult = {
        wells: [],
        total: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(operatorId);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery),
      );
      expect(result).toEqual({
        wells: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should handle large datasets with multiple pages', async () => {
      const operatorId = 'operator-123';
      const page = 3;
      const limit = 20;
      const mockWells: WellDto[] = Array.from({ length: 20 }, (_, i) => ({
        id: `well-${i + 41}`,
        name: `Well #${i + 41}`,
        apiNumber: `42123123${(i + 41).toString().padStart(2, '0')}`,
        operatorId,
        wellType: WellType.OIL,
        status: WellStatus.ACTIVE,
        location: {
          coordinates: {
            latitude: 32.7767,
            longitude: -96.797,
          },
          address: `${i + 41} Test St`,
          county: 'Dallas',
          state: 'TX',
          country: 'US',
        },
        spudDate: new Date('2024-01-15'),
        totalDepth: 8500,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        version: 1,
      }));

      const mockResult = {
        wells: mockWells,
        total: 156,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        page,
        limit,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(GetWellsByOperatorQuery),
      );
      expect(result).toEqual({
        wells: mockWells,
        total: 156,
        page: 3,
        limit: 20,
        totalPages: 8, // Math.ceil(156 / 20) = 8
      });
    });

    it('should handle query execution errors', async () => {
      const operatorId = 'operator-123';

      mockQueryBus.execute.mockRejectedValue(new Error('Database error'));

      await expect(controller.getWellsByOperator(operatorId)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle invalid operator ID gracefully', async () => {
      const invalidOperatorId = '';

      mockQueryBus.execute.mockRejectedValue(new Error('Invalid operator ID'));

      await expect(
        controller.getWellsByOperator(invalidOperatorId),
      ).rejects.toThrow('Invalid operator ID');
    });

    it('should pass correct parameters to GetWellsByOperatorQuery', async () => {
      const operatorId = 'operator-123';
      const page = 2;
      const limit = 5;
      const status = 'ACTIVE';
      const wellType = 'OIL';

      const mockResult = {
        wells: [],
        total: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      await controller.getWellsByOperator(
        operatorId,
        page,
        limit,
        status,
        wellType,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          operatorId,
          page,
          limit,
          filters: {
            status,
            wellType,
          },
        }),
      );
    });

    it('should handle negative page numbers gracefully', async () => {
      const operatorId = 'operator-123';
      const page = -1;
      const limit = 10;

      const mockResult = {
        wells: [],
        total: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        page,
        limit,
      );

      expect(result.page).toBe(-1); // Controller doesn't validate, just passes through
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          operatorId,
          page: -1,
          limit: 10,
        }),
      );
    });

    it('should handle zero limit gracefully', async () => {
      const operatorId = 'operator-123';
      const page = 1;
      const limit = 0;

      const mockResult = {
        wells: [],
        total: 0,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        page,
        limit,
      );

      expect(result.limit).toBe(0);
      expect(result.totalPages).toBe(Infinity); // Math.ceil(0 / 0) = Infinity
    });

    it('should handle very large page numbers', async () => {
      const operatorId = 'operator-123';
      const page = 999999;
      const limit = 10;

      const mockResult = {
        wells: [],
        total: 100,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getWellsByOperator(
        operatorId,
        page,
        limit,
      );

      expect(result.page).toBe(999999);
      expect(result.totalPages).toBe(10); // Math.ceil(100 / 10) = 10
    });
  });
});
