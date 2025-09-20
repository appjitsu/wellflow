import { Test, TestingModule } from '@nestjs/testing';
import { GetWellsByOperatorHandler } from './get-wells-by-operator.handler';
import { GetWellsByOperatorQuery } from '../queries/get-wells-by-operator.query';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { WellDto } from '../dtos/well.dto';
import { WellStatus } from '../../domain/enums/well-status.enum';
import { WellType } from '../../domain/enums/well-status.enum';

describe('GetWellsByOperatorHandler', () => {
  let handler: GetWellsByOperatorHandler;
  let wellRepository: jest.Mocked<WellRepository>;

  const mockWellRepository = {
    findByApiNumber: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findByOperator: jest.fn(),
    findNearby: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findWithPagination: jest.fn(),
  };

  const createMockWell = (
    id: string,
    apiNumber: string,
    name: string,
    status: WellStatus = WellStatus.PLANNED,
    wellType: WellType = WellType.OIL,
  ) => ({
    getId: jest.fn().mockReturnValue(id),
    getApiNumber: jest.fn().mockReturnValue({ getValue: () => apiNumber }),
    getName: jest.fn().mockReturnValue(name),
    getOperatorId: jest.fn().mockReturnValue('operator-123'),
    getWellType: jest.fn().mockReturnValue(wellType),
    getStatus: jest.fn().mockReturnValue(status),
    getLocation: jest.fn().mockReturnValue({
      getCoordinates: () => ({
        getLatitude: () => 40.7128,
        getLongitude: () => -74.006,
      }),
      getAddress: () => '123 Main St',
      getCounty: () => 'Dallas',
      getState: () => 'TX',
      getCountry: () => 'USA',
      toObject: () => ({
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        address: '123 Main St',
        county: 'Dallas',
        state: 'TX',
        country: 'USA',
      }),
    }),
    getLeaseId: jest.fn().mockReturnValue('lease-123'),
    getSpudDate: jest.fn().mockReturnValue(new Date('2024-01-01')),
    getCompletionDate: jest.fn().mockReturnValue(null),
    getTotalDepth: jest.fn().mockReturnValue(5000),
    getCreatedAt: jest.fn().mockReturnValue(new Date('2024-01-01T10:00:00Z')),
    getUpdatedAt: jest.fn().mockReturnValue(new Date('2024-01-01T10:00:00Z')),
    getVersion: jest.fn().mockReturnValue(1),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWellsByOperatorHandler,
        {
          provide: 'WellRepository',
          useValue: mockWellRepository,
        },
      ],
    }).compile();

    handler = module.get<GetWellsByOperatorHandler>(GetWellsByOperatorHandler);
    wellRepository = module.get('WellRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validQuery = new GetWellsByOperatorQuery('operator-123', 1, 10);

    it('should return paginated wells for operator', async () => {
      const mockWells = [
        createMockWell('well-1', '42-123-00001', 'Well 1'),
        createMockWell('well-2', '42-123-00002', 'Well 2'),
        createMockWell('well-3', '42-123-00003', 'Well 3'),
      ];

      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 3,
      });

      const result = await handler.execute(validQuery);

      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        0, // offset
        10, // limit
        {
          operatorId: 'operator-123',
          status: undefined,
          wellType: undefined,
        },
      );

      expect(result).toEqual({
        wells: expect.arrayContaining([
          expect.objectContaining({ id: 'well-1' }),
          expect.objectContaining({ id: 'well-2' }),
          expect.objectContaining({ id: 'well-3' }),
        ]),
        total: 3,
      });

      expect(result.wells).toHaveLength(3);
      expect(result.wells[0].id).toBe('well-1');
      expect(result.wells[1].id).toBe('well-2');
      expect(result.wells[2].id).toBe('well-3');
    });

    it('should handle empty results', async () => {
      wellRepository.findWithPagination.mockResolvedValue({
        wells: [] as any,
        total: 0,
      });

      const result = await handler.execute(validQuery);

      expect(result).toEqual({
        wells: [],
        total: 0,
      });
    });

    it('should calculate correct offset for different pages', async () => {
      const mockWells = [createMockWell('well-1', '42-123-00001', 'Well 1')];
      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      // Test page 1
      const query1 = new GetWellsByOperatorQuery('operator-123', 1, 10);
      await handler.execute(query1);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        0,
        10,
        expect.any(Object),
      );

      // Test page 2
      const query2 = new GetWellsByOperatorQuery('operator-123', 2, 10);
      await handler.execute(query2);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        10,
        10,
        expect.any(Object),
      );

      // Test page 3
      const query3 = new GetWellsByOperatorQuery('operator-123', 3, 10);
      await handler.execute(query3);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        20,
        10,
        expect.any(Object),
      );
    });

    it('should handle different page sizes', async () => {
      const mockWells = [createMockWell('well-1', '42-123-00001', 'Well 1')];
      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      // Test page size 5
      const query1 = new GetWellsByOperatorQuery('operator-123', 1, 5);
      await handler.execute(query1);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        0,
        5,
        expect.any(Object),
      );

      // Test page size 25
      const query2 = new GetWellsByOperatorQuery('operator-123', 1, 25);
      await handler.execute(query2);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        0,
        25,
        expect.any(Object),
      );

      // Test page size 100
      const query3 = new GetWellsByOperatorQuery('operator-123', 1, 100);
      await handler.execute(query3);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        0,
        100,
        expect.any(Object),
      );
    });

    it('should handle status filter', async () => {
      const mockWells = [
        createMockWell(
          'well-1',
          '42-123-00001',
          'Well 1',
          WellStatus.PRODUCING,
        ),
      ];
      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      const queryWithStatusFilter = new GetWellsByOperatorQuery(
        'operator-123',
        1,
        10,
        { status: WellStatus.PRODUCING },
      );

      const result = await handler.execute(queryWithStatusFilter);

      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(0, 10, {
        operatorId: 'operator-123',
        status: WellStatus.PRODUCING,
        wellType: undefined,
      });

      expect(result.wells).toHaveLength(1);
      expect(result.wells[0].status).toBe(WellStatus.PRODUCING);
    });

    it('should handle well type filter', async () => {
      const mockWells = [
        createMockWell(
          'well-1',
          '42-123-00001',
          'Well 1',
          WellStatus.PLANNED,
          WellType.GAS,
        ),
      ];
      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      const queryWithTypeFilter = new GetWellsByOperatorQuery(
        'operator-123',
        1,
        10,
        { wellType: WellType.GAS },
      );

      const result = await handler.execute(queryWithTypeFilter);

      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(0, 10, {
        operatorId: 'operator-123',
        status: undefined,
        wellType: WellType.GAS,
      });

      expect(result.wells).toHaveLength(1);
      expect(result.wells[0].wellType).toBe(WellType.GAS);
    });

    it('should handle both status and well type filters', async () => {
      const mockWells = [
        createMockWell(
          'well-1',
          '42-123-00001',
          'Well 1',
          WellStatus.DRILLING,
          WellType.GAS,
        ),
      ];
      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      const queryWithBothFilters = new GetWellsByOperatorQuery(
        'operator-123',
        1,
        10,
        {
          status: WellStatus.DRILLING,
          wellType: WellType.GAS,
        },
      );

      const result = await handler.execute(queryWithBothFilters);

      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(0, 10, {
        operatorId: 'operator-123',
        status: WellStatus.DRILLING,
        wellType: WellType.GAS,
      });

      expect(result.wells).toHaveLength(1);
      expect(result.wells[0].status).toBe(WellStatus.DRILLING);
      expect(result.wells[0].wellType).toBe(WellType.GAS);
    });

    it('should handle different operator IDs', async () => {
      const operatorIds = ['operator-001', 'operator-002', 'operator-003'];
      const mockWells = [createMockWell('well-1', '42-123-00001', 'Well 1')];

      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      for (const operatorId of operatorIds) {
        const query = new GetWellsByOperatorQuery(operatorId, 1, 10);
        await handler.execute(query);

        expect(wellRepository.findWithPagination).toHaveBeenCalledWith(0, 10, {
          operatorId,
          status: undefined,
          wellType: undefined,
        });
      }

      expect(wellRepository.findWithPagination).toHaveBeenCalledTimes(
        operatorIds.length,
      );
    });

    it('should handle large datasets with proper pagination', async () => {
      const mockWells = Array.from({ length: 10 }, (_, i) =>
        createMockWell(
          `well-${i + 1}`,
          `42-123-${String(i + 1).padStart(5, '0')}`,
          `Well ${i + 1}`,
        ),
      );

      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1000, // Large total
      });

      const query = new GetWellsByOperatorQuery('operator-123', 5, 10); // Page 5
      const result = await handler.execute(query);

      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        40, // (5-1) * 10 = 40
        10,
        expect.any(Object),
      );

      expect(result.wells).toHaveLength(10);
      expect(result.total).toBe(1000);
    });

    it('should handle repository errors', async () => {
      wellRepository.findWithPagination.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(handler.execute(validQuery)).rejects.toThrow(
        'Database connection failed',
      );
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        0,
        10,
        expect.any(Object),
      );
    });

    it('should handle query timeout errors', async () => {
      wellRepository.findWithPagination.mockRejectedValue(
        new Error('Query timeout'),
      );

      await expect(handler.execute(validQuery)).rejects.toThrow(
        'Query timeout',
      );
    });

    it('should handle network errors', async () => {
      wellRepository.findWithPagination.mockRejectedValue(
        new Error('Network unreachable'),
      );

      await expect(handler.execute(validQuery)).rejects.toThrow(
        'Network unreachable',
      );
    });

    it('should handle all well statuses in filters', async () => {
      const statuses = [
        WellStatus.PLANNED,
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        WellStatus.PRODUCING,
        WellStatus.SHUT_IN,
        WellStatus.PLUGGED,
      ];

      for (const status of statuses) {
        const mockWells = [
          createMockWell('well-1', '42-123-00001', 'Well 1', status),
        ];
        wellRepository.findWithPagination.mockResolvedValue({
          wells: mockWells as any,
          total: 1,
        });

        const query = new GetWellsByOperatorQuery('operator-123', 1, 10, {
          status,
        });
        const result = await handler.execute(query);

        expect(result.wells[0].status).toBe(status);
      }
    });

    it('should handle all well types in filters', async () => {
      const types = [WellType.OIL, WellType.GAS];

      for (const wellType of types) {
        const mockWells = [
          createMockWell(
            'well-1',
            '42-123-00001',
            'Well 1',
            WellStatus.PLANNED,
            wellType,
          ),
        ];
        wellRepository.findWithPagination.mockResolvedValue({
          wells: mockWells as any,
          total: 1,
        });

        const query = new GetWellsByOperatorQuery('operator-123', 1, 10, {
          wellType,
        });
        const result = await handler.execute(query);

        expect(result.wells[0].wellType).toBe(wellType);
      }
    });

    it('should handle edge case pagination values', async () => {
      const mockWells = [createMockWell('well-1', '42-123-00001', 'Well 1')];
      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      // Test page 1, limit 1
      const query1 = new GetWellsByOperatorQuery('operator-123', 1, 1);
      await handler.execute(query1);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        0,
        1,
        expect.any(Object),
      );

      // Test large page number
      const query2 = new GetWellsByOperatorQuery('operator-123', 1000, 10);
      await handler.execute(query2);
      expect(wellRepository.findWithPagination).toHaveBeenCalledWith(
        9990,
        10,
        expect.any(Object),
      );
    });

    it('should handle concurrent queries for different operators', async () => {
      const mockWells = [createMockWell('well-1', '42-123-00001', 'Well 1')];
      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 1,
      });

      const queries = [
        new GetWellsByOperatorQuery('operator-1', 1, 10),
        new GetWellsByOperatorQuery('operator-2', 1, 10),
        new GetWellsByOperatorQuery('operator-3', 1, 10),
      ];

      const promises = queries.map((query) => handler.execute(query));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.wells).toEqual(
          expect.arrayContaining([expect.objectContaining({ id: 'well-1' })]),
        );
        expect(result.total).toBe(1);
      });
      expect(wellRepository.findWithPagination).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed well types and statuses in results', async () => {
      const mockWells = [
        createMockWell(
          'well-1',
          '42-123-00001',
          'Oil Well 1',
          WellStatus.PRODUCING,
          WellType.OIL,
        ),
        createMockWell(
          'well-2',
          '42-123-00002',
          'Gas Well 1',
          WellStatus.DRILLING,
          WellType.GAS,
        ),
        createMockWell(
          'well-3',
          '42-123-00003',
          'Oil Well 2',
          WellStatus.COMPLETED,
          WellType.OIL,
        ),
      ];

      wellRepository.findWithPagination.mockResolvedValue({
        wells: mockWells as any,
        total: 3,
      });

      const result = await handler.execute(validQuery);

      expect(result.wells).toHaveLength(3);
      expect(result.wells[0].wellType).toBe(WellType.OIL);
      expect(result.wells[0].status).toBe(WellStatus.PRODUCING);
      expect(result.wells[1].wellType).toBe(WellType.GAS);
      expect(result.wells[1].status).toBe(WellStatus.DRILLING);
      expect(result.wells[2].wellType).toBe(WellType.OIL);
      expect(result.wells[2].status).toBe(WellStatus.COMPLETED);
    });
  });
});
