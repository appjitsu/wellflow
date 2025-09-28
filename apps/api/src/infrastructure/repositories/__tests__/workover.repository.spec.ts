import { Test, TestingModule } from '@nestjs/testing';
import { WorkoverRepository } from '../workover.repository';
import { DatabaseService } from '../../../database/database.service';
import { Workover } from '../../../domain/entities/workover.entity';
import { WorkoverStatus } from '../../../domain/enums/workover-status.enum';
import { workovers } from '../../../database/schemas/workovers';

describe('WorkoverRepository', () => {
  let repository: WorkoverRepository;
  let mockDatabaseService: any;
  let mockDb: any;

  const mockWorkoverRow = {
    id: 'workover-123',
    organizationId: 'org-456',
    wellId: 'well-789',
    afeId: 'afe-101',
    reason: 'Routine maintenance',
    status: WorkoverStatus.PLANNED,
    startDate: '2024-01-15',
    endDate: null,
    estimatedCost: '50000.00',
    actualCost: null,
    preProduction: { oilRate: 100, waterRate: 50 },
    postProduction: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
    };

    // Set up nested chain methods to return promises at the end
    mockDb.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue(Promise.resolve([])),
          offset: jest.fn().mockReturnValue(Promise.resolve([])),
          orderBy: jest.fn().mockReturnValue(Promise.resolve([])),
        }),
      }),
    });

    mockDb.insert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue(Promise.resolve([])),
      }),
    });

    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue(Promise.resolve([])),
        }),
      }),
    });

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoverRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<WorkoverRepository>(WorkoverRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save new workover successfully', async () => {
      const workover = Workover.fromPersistence({
        id: 'workover-new',
        organizationId: 'org-456',
        wellId: 'well-789',
        afeId: null,
        reason: 'New workover',
        status: WorkoverStatus.PLANNED,
        startDate: new Date('2024-02-01'),
        endDate: null,
        estimatedCost: '75000.00',
        actualCost: null,
        preProductionSnapshot: { oilRate: 80, waterRate: 40 },
        postProductionSnapshot: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock findById to return null (not found)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue(Promise.resolve([])),
          }),
        }),
      });

      // Mock insert to return the inserted row
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockReturnValue(Promise.resolve([mockWorkoverRow])),
        }),
      });

      const result = await repository.save(workover);

      expect(result).toBeInstanceOf(Workover);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(workovers);
    });

    it('should update existing workover successfully', async () => {
      const workover = Workover.fromPersistence({
        id: 'workover-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        afeId: 'afe-101',
        reason: 'Updated maintenance',
        status: WorkoverStatus.IN_PROGRESS,
        startDate: new Date('2024-01-15'),
        endDate: null,
        estimatedCost: '60000.00',
        actualCost: null,
        preProductionSnapshot: { oilRate: 100, waterRate: 50 },
        postProductionSnapshot: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      // Mock findById to return existing workover
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue(Promise.resolve([mockWorkoverRow])),
          }),
        }),
      });

      // Mock update to succeed
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockReturnValue(Promise.resolve({ rowCount: 1 })),
          }),
        }),
      });

      const result = await repository.save(workover);

      expect(result).toBe(workover);
      expect(mockDb.update).toHaveBeenCalledWith(workovers);
    });
  });

  describe('findById', () => {
    it('should find workover by id', async () => {
      // Mock the select chain to return the workover row
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue(Promise.resolve([mockWorkoverRow])),
          }),
        }),
      });

      const result = await repository.findById('workover-123');

      expect(result).toBeInstanceOf(Workover);
      expect(result?.toPersistence().id).toBe('workover-123');
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.select().from).toHaveBeenCalledWith(workovers);
    });

    it('should return null when workover not found', async () => {
      // Mock the select chain to return empty array
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue(Promise.resolve([])),
          }),
        }),
      });

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrganizationId', () => {
    it('should find workovers by organization id', async () => {
      const mockRows = [
        mockWorkoverRow,
        { ...mockWorkoverRow, id: 'workover-456' },
      ];

      // Mock the select chain to return workover rows
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue(Promise.resolve(mockRows)),
              }),
            }),
          }),
        }),
      });

      const result = await repository.findByOrganizationId('org-456');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Workover);
      expect(result[1]).toBeInstanceOf(Workover);
    });

    it('should apply status filter', async () => {
      const mockRows = [mockWorkoverRow];

      // Mock the select chain to return filtered workover rows
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue(Promise.resolve(mockRows)),
              }),
            }),
          }),
        }),
      });

      const result = await repository.findByOrganizationId('org-456', {
        status: WorkoverStatus.PLANNED,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Workover);
    });

    it('should apply wellId filter', async () => {
      const mockRows = [mockWorkoverRow];

      // Mock the select chain to return filtered workover rows
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue(Promise.resolve(mockRows)),
              }),
            }),
          }),
        }),
      });

      const result = await repository.findByOrganizationId('org-456', {
        wellId: 'well-789',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Workover);
    });

    it('should apply pagination options', async () => {
      const mockRows = [mockWorkoverRow];

      // Mock the select chain to return paginated workover rows
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue(Promise.resolve(mockRows)),
              }),
            }),
          }),
        }),
      });

      const result = await repository.findByOrganizationId('org-456', {
        limit: 10,
        offset: 20,
      });

      expect(result).toHaveLength(1);
      expect(
        mockDb.select().from().where().orderBy().limit,
      ).toHaveBeenCalledWith(10);
      expect(
        mockDb.select().from().where().orderBy().limit().offset,
      ).toHaveBeenCalledWith(20);
    });
  });

  describe('findByWellId', () => {
    it('should find workovers by well id', async () => {
      const mockRows = [mockWorkoverRow];

      // Mock the select chain to return workover rows
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue(Promise.resolve(mockRows)),
        }),
      });

      const result = await repository.findByWellId('well-789');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Workover);
      expect(mockDb.select().from().where).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when save fails on insert', async () => {
      const workover = Workover.fromPersistence({
        id: 'workover-new',
        organizationId: 'org-456',
        wellId: 'well-789',
        afeId: null,
        reason: 'New workover',
        status: WorkoverStatus.PLANNED,
        startDate: new Date('2024-02-01'),
        endDate: null,
        estimatedCost: '75000.00',
        actualCost: null,
        preProductionSnapshot: { oilRate: 80, waterRate: 40 },
        postProductionSnapshot: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock findById to return null
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue(Promise.resolve([])),
          }),
        }),
      });

      // Mock insert to throw error
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockReturnValue(Promise.reject(new Error('Database error'))),
        }),
      });

      await expect(repository.save(workover)).rejects.toThrow('Database error');
    });

    it('should throw error when findById fails', async () => {
      // Mock the select chain to throw error
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue(Promise.reject(new Error('Database error'))),
          }),
        }),
      });

      await expect(repository.findById('workover-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when findByOrganizationId fails', async () => {
      // Mock the select chain to throw error
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest
                  .fn()
                  .mockReturnValue(Promise.reject(new Error('Database error'))),
              }),
            }),
          }),
        }),
      });

      await expect(repository.findByOrganizationId('org-456')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
