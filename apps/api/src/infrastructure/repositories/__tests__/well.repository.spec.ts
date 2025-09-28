import { Test, TestingModule } from '@nestjs/testing';
import { WellRepositoryImpl } from '../well.repository';
import { Well } from '../../../domain/entities/well.entity';
import { ApiNumber } from '../../../domain/value-objects/api-number';
import { Location } from '../../../domain/value-objects/location';
import { Coordinates } from '../../../domain/value-objects/coordinates';
import { WellStatus, WellType } from '../../../domain/enums/well-status.enum';
import { AuditLogService } from '../../../application/services/audit-log.service';
import { DatabaseService } from '../../../database/database.service';

describe('WellRepositoryImpl', () => {
  let repository: WellRepositoryImpl;
  let mockDb: {
    insert: jest.Mock;
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    limit: jest.Mock;
    offset: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
    values: jest.Mock;
    delete: jest.Mock;
  };
  let mockDatabaseService: { getDb: jest.Mock };

  const mockWellData = {
    id: 'well-123',
    apiNumber: '4212345678',
    wellName: 'Test Well #1', // Database column name
    organizationId: 'operator-123', // Database column name
    leaseId: 'lease-123',
    wellType: WellType.OIL,
    status: 'drilling', // Database stores as lowercase string
    latitude: '32.7767', // Database stores as string
    longitude: '-96.797', // Database stores as string
    spudDate: new Date('2024-01-15'),
    completionDate: null,
    totalDepth: '8500', // Database stores as string
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    // Create a sophisticated mock that can handle different query patterns
    mockDb = {
      select: jest.fn(),
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn(),
      offset: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
      insert: jest.fn(),
      values: jest.fn(),
      delete: jest.fn(),
    };

    // Set up default chaining behavior
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
    mockDb.offset.mockReturnValue(mockDb);
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);
    mockDb.delete.mockReturnValue(mockDb);

    // Mock DatabaseService
    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WellRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: AuditLogService,
          useValue: {
            logCreate: jest.fn(),
            logUpdate: jest.fn(),
            logDelete: jest.fn(),
            logAction: jest.fn(),
            logSuccess: jest.fn(),
            logFailure: jest.fn(),
            logExecute: jest.fn(),
            logRead: jest.fn(),
            logLogin: jest.fn(),
            logLogout: jest.fn(),
            logExport: jest.fn(),
            logImport: jest.fn(),
            logApprove: jest.fn(),
            logReject: jest.fn(),
            logSubmit: jest.fn(),
            logSystemAction: jest.fn(),
            logApiCall: jest.fn(),
            logBatch: jest.fn(),
            getContext: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<WellRepositoryImpl>(WellRepositoryImpl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    let testWell: Well;

    beforeEach(() => {
      const coordinates = new Coordinates(32.7767, -96.797);
      const location = new Location(coordinates, {
        address: '123 Oil Field Rd',
        county: 'Dallas',
        state: 'TX',
        country: 'USA',
      });

      testWell = new Well(
        'well-123',
        new ApiNumber('4212345678'),
        'Test Well #1',
        'operator-123',
        WellType.OIL,
        location,
        {
          status: WellStatus.DRILLING,
        },
      );
    });

    it('should insert new well when it does not exist', async () => {
      // Mock existing check to return empty array (well doesn't exist)
      mockDb.limit.mockResolvedValueOnce([]);
      mockDb.values.mockResolvedValueOnce(undefined);

      await repository.save(testWell);

      expect(mockDb.select).toHaveBeenCalledWith();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it.skip('should update existing well when it exists', async () => {
      // Mock the existing check chain: select().from().where().limit()
      mockDb.limit.mockResolvedValueOnce([{ id: 'well-123' }]);
      // Mock the update chain: update().set().where()
      mockDb.where.mockResolvedValueOnce(undefined);

      await repository.save(testWell);

      expect(mockDb.select).toHaveBeenCalledWith({ id: expect.any(Object) });
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should handle database errors during save', async () => {
      mockDb.limit.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.save(testWell)).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return well when found', async () => {
      // Mock the final method in the chain to return a promise
      mockDb.limit.mockResolvedValueOnce([mockWellData]);

      const result = await repository.findById('well-123');

      expect(result).toBeInstanceOf(Well);
      expect(result?.getId().getValue()).toBe('well-123');
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when well not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await repository.findById('nonexistent-well');

      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      mockDb.limit.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findById('well-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findByApiNumber', () => {
    it('should return well when found by API number', async () => {
      mockDb.limit.mockResolvedValueOnce([mockWellData]);

      const apiNumber = new ApiNumber('4212345678');
      const result = await repository.findByApiNumber(apiNumber);

      expect(result).toBeInstanceOf(Well);
      expect(result?.getApiNumber().getValue()).toBe('42-123-45678');
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return null when well not found by API number', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const apiNumber = new ApiNumber('4299999999');
      const result = await repository.findByApiNumber(apiNumber);

      expect(result).toBeNull();
    });
  });

  describe('findByOperatorId', () => {
    it('should return wells for operator', async () => {
      mockDb.where.mockResolvedValueOnce([
        mockWellData,
        { ...mockWellData, id: 'well-456' },
      ]);

      const result = await repository.findByOperatorId('operator-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Well);
      expect(result[1]).toBeInstanceOf(Well);
    });

    it('should return empty array when no wells found for operator', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.findByOperatorId('nonexistent-operator');

      expect(result).toEqual([]);
    });
  });

  describe('findByLeaseId', () => {
    it('should return wells for lease', async () => {
      mockDb.where.mockResolvedValueOnce([mockWellData]);

      const result = await repository.findByLeaseId('lease-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Well);
    });

    it('should return empty array when no wells found for lease', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.findByLeaseId('nonexistent-lease');

      expect(result).toEqual([]);
    });
  });

  describe('findByLocation', () => {
    it('should return wells within radius', async () => {
      mockDb.where.mockResolvedValueOnce([mockWellData]);

      const result = await repository.findByLocation(32.7767, -96.797, 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Well);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should return empty array when no wells found in location', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.findByLocation(0, 0, 1);

      expect(result).toEqual([]);
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated wells without filters', async () => {
      const mockWells = [mockWellData];
      const mockCount = [{ count: 1 }];

      // Mock the wells query chain: select().from().offset().limit()
      mockDb.limit.mockResolvedValueOnce(mockWells);

      // Create a separate mock for the count query
      const countMock = {
        from: jest.fn().mockResolvedValueOnce(mockCount),
      };
      mockDb.select.mockReturnValueOnce(mockDb).mockReturnValueOnce(countMock);

      const result = await repository.findWithPagination(0, 10);

      expect(result.wells).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.wells[0]).toBeInstanceOf(Well);
    });

    it('should return paginated wells with filters', async () => {
      const mockWells = [mockWellData];
      const mockCount = [{ count: 1 }];

      // Mock the wells query chain: select().from().where().offset().limit()
      mockDb.limit.mockResolvedValueOnce(mockWells);

      // Create a separate mock for the count query
      const countMock = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValueOnce(mockCount),
        }),
      };
      mockDb.select.mockReturnValueOnce(mockDb).mockReturnValueOnce(countMock);

      const filters = {
        operatorId: 'operator-123',
        status: WellStatus.DRILLING,
        wellType: WellType.OIL,
      };

      const result = await repository.findWithPagination(0, 10, filters);

      expect(result.wells).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle single filter condition', async () => {
      const mockWells = [mockWellData];
      const mockCount = [{ count: 1 }];

      // Mock the wells query chain: select().from().where().offset().limit()
      mockDb.limit.mockResolvedValueOnce(mockWells);

      // Create a separate mock for the count query
      const countMock = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValueOnce(mockCount),
        }),
      };
      mockDb.select.mockReturnValueOnce(mockDb).mockReturnValueOnce(countMock);

      const filters = { operatorId: 'operator-123' };
      const result = await repository.findWithPagination(0, 10, filters);

      expect(result.wells).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete well by id', async () => {
      mockDb.where.mockResolvedValueOnce(undefined);

      await repository.delete('well-123');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });

    it('should handle database errors during delete', async () => {
      mockDb.where.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.delete('well-123')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('existsByApiNumber', () => {
    it('should return true when API number exists', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'well-123' }]);

      const apiNumber = new ApiNumber('4212345678');
      const result = await repository.existsByApiNumber(apiNumber);

      expect(result).toBe(true);
    });

    it('should return false when API number does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const apiNumber = new ApiNumber('4299999999');
      const result = await repository.existsByApiNumber(apiNumber);

      expect(result).toBe(false);
    });
  });

  describe('mapToEntity (private method)', () => {
    it('should correctly map database row to Well entity', async () => {
      mockDb.limit.mockResolvedValueOnce([mockWellData]);

      const result = await repository.findById('well-123');

      expect(result).toBeInstanceOf(Well);
      expect(result?.getId().getValue()).toBe(mockWellData.id);
      expect(result?.getName()).toBe(mockWellData.wellName);
      expect(result?.getApiNumber().getValue()).toBe('42-123-45678'); // ApiNumber formats the input
      expect(result?.getOperatorId()).toBe(mockWellData.organizationId);
      expect(result?.getWellType()).toBe(mockWellData.wellType);
      expect(result?.getStatus()).toBe(WellStatus.DRILLING);
    });

    it('should handle location mapping correctly', async () => {
      mockDb.limit.mockResolvedValueOnce([mockWellData]);

      const result = await repository.findById('well-123');

      expect(result?.getLocation()).toBeInstanceOf(Location);
      expect(result?.getLocation().getCoordinates().getLatitude()).toBe(
        parseFloat(mockWellData.latitude),
      );
      expect(result?.getLocation().getCoordinates().getLongitude()).toBe(
        parseFloat(mockWellData.longitude),
      );
    });
  });
});
