import { Test, TestingModule } from '@nestjs/testing';
import { ProductionRepository } from './production.repository';

describe('ProductionRepository', () => {
  let repository: ProductionRepository;
  let mockDb: any;

  beforeEach(async () => {
    // Create comprehensive mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      selectDistinct: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      union: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionRepository,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<ProductionRepository>(ProductionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(repository).toBeDefined();
    });

    it('should be an instance of ProductionRepository', () => {
      expect(repository).toBeInstanceOf(ProductionRepository);
    });
  });

  describe('dateToString', () => {
    it('should convert date to string format', () => {
      const date = new Date('2023-01-15T10:30:00Z');
      const result = (repository as any).dateToString(date);
      expect(result).toBe('2023-01-15');
    });

    it('should throw error for undefined date', () => {
      expect(() => (repository as any).dateToString(undefined)).toThrow(
        'Date is required',
      );
    });

    it('should handle different date formats', () => {
      const dates = [
        new Date('2023-12-31T23:59:59Z'),
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-06-15T12:00:00Z'),
      ];

      const results = dates.map((date) =>
        (repository as any).dateToString(date),
      );
      expect(results).toEqual(['2023-12-31', '2023-01-01', '2023-06-15']);
    });
  });

  describe('findByWellAndDateRange', () => {
    it('should find production records by well and date range', async () => {
      const mockRecords = [
        { id: 'prod-1', wellId: 'well-1', productionDate: '2023-01-15' },
        { id: 'prod-2', wellId: 'well-1', productionDate: '2023-01-14' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockRecords),
          }),
        }),
      });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const result = await repository.findByWellAndDateRange(
        'well-1',
        startDate,
        endDate,
      );

      expect(result).toEqual(mockRecords);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array when no records found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const result = await repository.findByWellAndDateRange(
        'nonexistent-well',
        startDate,
        endDate,
      );

      expect(result).toEqual([]);
    });
  });

  describe('findByOrganizationAndDateRange', () => {
    it('should find production records by organization and date range', async () => {
      const mockRecords = [
        { id: 'prod-1', organizationId: 'org-1', productionDate: '2023-01-15' },
        { id: 'prod-2', organizationId: 'org-1', productionDate: '2023-01-14' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockRecords),
          }),
        }),
      });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const result = await repository.findByOrganizationAndDateRange(
        'org-1',
        startDate,
        endDate,
      );

      expect(result).toEqual(mockRecords);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const result = await repository.findByOrganizationAndDateRange(
        'org-1',
        startDate,
        endDate,
      );

      expect(result).toEqual([]);
    });
  });

  // eslint-disable-next-line no-secrets/no-secrets
  describe('getWellProductionSummary', () => {
    it('should get well production summary without date range', async () => {
      const mockSummary = [
        {
          totalOil: '1000',
          totalGas: '2000',
          totalWater: '500',
          averageOil: '100',
          averageGas: '200',
          averageWater: '50',
          recordCount: '10',
        },
      ];

      const mockDateRange = [
        { firstDate: '2023-01-01', lastDate: '2023-01-01' },
        { firstDate: '2023-01-31', lastDate: '2023-01-31' },
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockSummary),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  union: jest.fn().mockResolvedValue(mockDateRange),
                }),
              }),
            }),
          }),
        });

      const result = await repository.getWellProductionSummary('well-1');

      expect(result).toEqual({
        totalOil: 1000,
        totalGas: 2000,
        totalWater: 500,
        averageOil: 100,
        averageGas: 200,
        averageWater: 50,
        recordCount: 10,
        firstProductionDate: new Date('2023-01-01'),
        lastProductionDate: new Date('2023-01-31'),
      });
    });

    it('should get well production summary with date range', async () => {
      const mockSummary = [
        {
          totalOil: '500',
          totalGas: '1000',
          totalWater: '250',
          averageOil: '50',
          averageGas: '100',
          averageWater: '25',
          recordCount: '5',
        },
      ];

      const mockDateRange = [
        { firstDate: '2023-01-15', lastDate: '2023-01-15' },
        { firstDate: '2023-01-20', lastDate: '2023-01-20' },
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockSummary),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  union: jest.fn().mockResolvedValue(mockDateRange),
                }),
              }),
            }),
          }),
        });

      const startDate = new Date('2023-01-15');
      const endDate = new Date('2023-01-20');
      const result = await repository.getWellProductionSummary(
        'well-1',
        startDate,
        endDate,
      );

      expect(result).toEqual({
        totalOil: 500,
        totalGas: 1000,
        totalWater: 250,
        averageOil: 50,
        averageGas: 100,
        averageWater: 25,
        recordCount: 5,
        firstProductionDate: new Date('2023-01-15'),
        lastProductionDate: new Date('2023-01-20'),
      });
    });

    it('should handle null summary data', async () => {
      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([null]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  union: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }),
        });

      const result = await repository.getWellProductionSummary('well-1');

      expect(result).toEqual({
        totalOil: 0,
        totalGas: 0,
        totalWater: 0,
        averageOil: 0,
        averageGas: 0,
        averageWater: 0,
        recordCount: 0,
        firstProductionDate: null,
        lastProductionDate: null,
      });
    });
  });

  describe('getOrganizationProductionSummary', () => {
    it('should get organization production summary', async () => {
      const mockSummary = [
        {
          totalOil: '5000',
          totalGas: '10000',
          totalWater: '2500',
          recordCount: '50',
        },
      ];

      const mockWellCount = [
        { wellId: 'well-1' },
        { wellId: 'well-2' },
        { wellId: 'well-3' },
      ];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSummary),
        }),
      });

      mockDb.selectDistinct.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockWellCount),
        }),
      });

      const result = await repository.getOrganizationProductionSummary('org-1');

      expect(result).toEqual({
        totalOil: 5000,
        totalGas: 10000,
        totalWater: 2500,
        wellCount: 3,
        recordCount: 50,
      });
    });

    it('should handle date range filtering', async () => {
      const mockSummary = [
        {
          totalOil: '2500',
          totalGas: '5000',
          totalWater: '1250',
          recordCount: '25',
        },
      ];

      const mockWellCount = [{ wellId: 'well-1' }, { wellId: 'well-2' }];

      mockDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockSummary),
        }),
      });

      mockDb.selectDistinct.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockWellCount),
        }),
      });

      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const result = await repository.getOrganizationProductionSummary(
        'org-1',
        startDate,
        endDate,
      );

      expect(result).toEqual({
        totalOil: 2500,
        totalGas: 5000,
        totalWater: 1250,
        wellCount: 2,
        recordCount: 25,
      });
    });
  });

  describe('getMonthlyProduction', () => {
    it('should get monthly production aggregates', async () => {
      const mockRecords = [
        {
          month: '2023-01-15',
          totalOil: '1000',
          totalGas: '2000',
          totalWater: '500',
          recordCount: '10',
        },
        {
          month: '2023-02-15',
          totalOil: '1200',
          totalGas: '2400',
          totalWater: '600',
          recordCount: '12',
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue(mockRecords),
          }),
        }),
      });

      const result = await repository.getMonthlyProduction('org-1', 2023);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        month: 1,
        totalOil: 1000,
        totalGas: 2000,
        totalWater: 500,
        recordCount: 10,
      });
      expect(result[1]).toEqual({
        month: 2,
        totalOil: 1200,
        totalGas: 2400,
        totalWater: 600,
        recordCount: 12,
      });
    });

    it('should handle empty monthly data', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.getMonthlyProduction('org-1', 2023);

      expect(result).toEqual([]);
    });
  });

  describe('findLatestByWells', () => {
    it('should find latest production record for each well', async () => {
      const mockRecords = [
        [{ id: 'prod-1', wellId: 'well-1', productionDate: '2023-01-31' }],
        [{ id: 'prod-2', wellId: 'well-2', productionDate: '2023-01-30' }],
      ];

      mockDb.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockRecords[0]),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue(mockRecords[1]),
              }),
            }),
          }),
        });

      const result = await repository.findLatestByWells(['well-1', 'well-2']);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockRecords[0]?.[0]);
      expect(result[1]).toEqual(mockRecords[1]?.[0]);
    });

    it('should return empty array for empty well IDs', async () => {
      const result = await repository.findLatestByWells([]);
      expect(result).toEqual([]);
    });

    it('should handle wells with no production records', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await repository.findLatestByWells(['well-1']);
      expect(result).toEqual([]);
    });
  });

  describe('bulkInsert', () => {
    it('should bulk insert production records', async () => {
      const records = [
        { wellId: 'well-1', oilVolume: 100, gasVolume: 200, waterVolume: 50 },
        { wellId: 'well-2', oilVolume: 150, gasVolume: 300, waterVolume: 75 },
      ];

      const mockInsertedRecords = [
        { id: 'prod-1', ...records[0] },
        { id: 'prod-2', ...records[1] },
      ];

      jest
        .spyOn(repository, 'batchCreate')
        .mockResolvedValue(mockInsertedRecords as any);

      const result = await repository.bulkInsert(records as any);

      expect(result).toEqual(mockInsertedRecords);
      expect(repository.batchCreate).toHaveBeenCalledWith(records);
    });

    it('should return empty array for empty records', async () => {
      const result = await repository.bulkInsert([]);
      expect(result).toEqual([]);
    });
  });
});
