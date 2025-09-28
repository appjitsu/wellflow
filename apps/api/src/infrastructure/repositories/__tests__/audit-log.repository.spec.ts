import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogRepositoryImpl } from '../audit-log.repository';
import { DatabaseService } from '../../../database/database.service';
import {
  AuditLog,
  AuditAction,
  AuditResourceType,
} from '../../../domain/entities/audit-log.entity';
import { auditLogs } from '../../../database/schemas/audit-logs';

describe('AuditLogRepositoryImpl', () => {
  let repository: AuditLogRepositoryImpl;
  let mockDatabaseService: any;
  let mockDb: any;

  beforeEach(async () => {
    const mockAuditLogs: any[] = [];

    const limitMock = jest.fn().mockReturnValue(Promise.resolve([]));
    const offsetMock = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockAuditLogs));
    const orderByMock = jest.fn().mockReturnValue({
      limit: limitMock,
      offset: offsetMock,
    });
    const groupByMock = jest.fn().mockReturnValue(Promise.resolve([]));
    const thenMock = jest.fn().mockReturnValue(Promise.resolve(mockAuditLogs));
    const queryBuilder = {
      then: thenMock,
      limit: limitMock,
      offset: offsetMock,
      orderBy: orderByMock,
      groupBy: groupByMock,
    };

    const insertValuesMock = jest.fn().mockReturnValue(Promise.resolve([]));
    const updateSetMock = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue(Promise.resolve([])),
    });
    const deleteWhereMock = jest.fn().mockReturnValue(Promise.resolve([]));

    mockDb = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => queryBuilder),
        })),
      })),
      insert: jest.fn(() => ({
        values: insertValuesMock,
      })),
      update: jest.fn(() => ({
        set: updateSetMock,
      })),
      delete: jest.fn(() => ({
        where: deleteWhereMock,
      })),
      then: queryBuilder.then,
      limit: limitMock,
      offset: offsetMock,
      orderBy: orderByMock,
      groupBy: groupByMock,
      insertValues: insertValuesMock,
      updateSet: updateSetMock,
      deleteWhere: deleteWhereMock,
    };

    // Add flat references for tests that use them
    mockDb.from = mockDb.select().from;
    mockDb.where = mockDb.select().from().where;
    mockDb.limit = mockDb.select().from().where().limit;
    mockDb.offset = mockDb.select().from().where().offset;
    mockDb.orderBy = mockDb.select().from().where().orderBy;
    mockDb.groupBy = mockDb.select().from().where().groupBy;
    mockDb.values = mockDb.insert().values;
    mockDb.set = mockDb.update().set;
    mockDb.returning = mockDb.insert().values.returning;

    // Reset query index for each test
    mockDb.queryIndex = 0;

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<AuditLogRepositoryImpl>(AuditLogRepositoryImpl);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save audit log successfully', async () => {
      const auditLog = AuditLog.create({
        userId: 'user-123',
        organizationId: 'org-456',
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.WELL,
        resourceId: 'well-789',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        oldValues: { status: 'ACTIVE' },
        newValues: { status: 'COMPLETED' },
        success: true,
        metadata: { eventId: 'event-123' },
        requestId: 'req-123',
        endpoint: '/api/wells',
        method: 'POST',
        duration: 150,
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{}]),
        }),
      });

      await repository.save(auditLog);

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(auditLogs);
      expect(mockDb.insert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          userId: 'user-123',
          organizationId: 'org-456',
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-789',
          success: true,
          oldValues: JSON.stringify({ status: 'ACTIVE' }),
          newValues: JSON.stringify({ status: 'COMPLETED' }),
          metadata: JSON.stringify({ eventId: 'event-123' }),
          requestId: 'req-123',
          endpoint: '/api/wells',
          method: 'POST',
          duration: '150',
        }),
      );
    });

    it('should handle audit log with null values', async () => {
      const auditLog = AuditLog.create({
        userId: undefined,
        organizationId: undefined,
        action: AuditAction.READ,
        resourceType: AuditResourceType.WELL,
        resourceId: undefined,
        success: true,
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{}]),
        }),
      });

      await repository.save(auditLog);

      expect(mockDb.insert().values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          organizationId: null,
          resourceId: null,
          oldValues: null,
          newValues: null,
          metadata: null,
          requestId: null,
          endpoint: null,
          method: null,
          duration: null,
        }),
      );
    });
  });

  describe('saveBatch', () => {
    it('should save multiple audit logs successfully', async () => {
      const logs = [
        AuditLog.create({
          userId: 'user-1',
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          success: true,
        }),
        AuditLog.create({
          userId: 'user-2',
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.WELL,
          success: true,
        }),
      ];

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{}, {}]),
        }),
      });

      await repository.saveBatch(logs);

      expect(mockDb.insert).toHaveBeenCalledWith(auditLogs);
      expect(mockDb.insert().values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            action: AuditAction.CREATE,
          }),
          expect.objectContaining({
            userId: 'user-2',
            action: AuditAction.UPDATE,
          }),
        ]),
      );
    });

    it('should do nothing when audit logs array is empty', async () => {
      await repository.saveBatch([]);

      expect(mockDatabaseService.getDb).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find audit log by id', async () => {
      const mockRow = {
        id: 'log-123',
        userId: 'user-123',
        organizationId: 'org-456',
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.WELL,
        resourceId: 'well-789',
        timestamp: new Date('2024-01-15T10:00:00Z'),
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        oldValues: null,
        newValues: JSON.stringify({ name: 'Test Well' }),
        success: true,
        errorMessage: null,
        metadata: JSON.stringify({ eventId: 'event-123' }),
        requestId: 'req-123',
        endpoint: '/api/wells',
        method: 'POST',
        duration: '150',
      };

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue(Promise.resolve([mockRow])),
          }),
        }),
      });

      const result = await repository.findById('log-123');

      expect(result).toBeInstanceOf(AuditLog);
      expect(result?.getId().getValue()).toBe('log-123');
      expect(result?.getUserId()).toBe('user-123');
      expect(result?.getAction()).toBe(AuditAction.CREATE);
      expect(result?.getNewValues()).toEqual({ name: 'Test Well' });
    });

    it('should return null when audit log not found', async () => {
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

  describe('findByUserId', () => {
    it('should find audit logs by user id with default pagination', async () => {
      const mockRows = [
        {
          id: 'log-1',
          userId: 'user-123',
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          timestamp: new Date(),
          success: true,
        },
      ];

      // Mock chained methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock the query results
      let queryCount = 0;
      mockDb.offset.mockImplementation(() => {
        queryCount++;
        return Promise.resolve(mockRows);
      });
      mockDb.where.mockImplementation(() => {
        if (queryCount === 1) {
          // This is the count query (second query)
          return Promise.resolve([{ count: 1 }]);
        }
        return mockDb; // For the logs query, continue chaining
      });

      const result = await repository.findByUserId('user-123');

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPrevPage).toBe(false);
    });

    it('should find audit logs with custom pagination', async () => {
      const mockRows = Array.from({ length: 20 }, (_, i) => ({
        id: `log-${i + 1}`,
        userId: 'user-123',
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.WELL,
        timestamp: new Date(),
        success: true,
      }));

      // Mock chained methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock the query results
      let queryCount = 0;
      mockDb.offset.mockImplementation(() => {
        queryCount++;
        return Promise.resolve(mockRows);
      });
      mockDb.where.mockImplementation(() => {
        if (queryCount === 1) {
          // This is the count query (second query)
          return Promise.resolve([{ count: 100 }]);
        }
        return mockDb; // For the logs query, continue chaining
      });

      const result = await repository.findByUserId('user-123', {
        page: 3,
        limit: 20,
        sortBy: 'timestamp',
        sortOrder: 'asc',
      });

      expect(result.logs).toHaveLength(20);
      expect(result.total).toBe(100);
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPrevPage).toBe(true);
    });
  });

  describe('findByOrganizationId', () => {
    it('should find audit logs by organization id', async () => {
      const mockRows = [
        {
          id: 'log-1',
          organizationId: 'org-456',
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.WELL,
          timestamp: new Date(),
          success: true,
        },
      ];

      // Mock chained methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock the query results
      let queryCount = 0;
      mockDb.offset.mockImplementation(() => {
        queryCount++;
        return Promise.resolve(mockRows);
      });
      mockDb.where.mockImplementation(() => {
        if (queryCount === 1) {
          // This is the count query (second query)
          return Promise.resolve([{ count: 1 }]);
        }
        return mockDb; // For the logs query, continue chaining
      });

      const result = await repository.findByOrganizationId('org-456');

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findByResource', () => {
    it('should find audit logs by resource type and id', async () => {
      const mockRows = [
        {
          id: 'log-1',
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-123',
          action: AuditAction.DELETE,
          timestamp: new Date(),
          success: true,
        },
      ];

      // Mock chained methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock the query results
      let queryCount = 0;
      mockDb.offset.mockImplementation(() => {
        queryCount++;
        return Promise.resolve(mockRows);
      });
      mockDb.where.mockImplementation(() => {
        if (queryCount === 1) {
          // This is the count query (second query)
          return Promise.resolve([{ count: 1 }]);
        }
        return mockDb; // For the logs query, continue chaining
      });

      const result = await repository.findByResource(
        AuditResourceType.WELL,
        'well-123',
      );

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('search', () => {
    it('should search audit logs with filters', async () => {
      const filters = {
        userId: 'user-123',
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.WELL,
        success: true,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const mockRows = [
        {
          id: 'log-1',
          userId: 'user-123',
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          timestamp: new Date('2024-01-15'),
          success: true,
        },
      ];

      // Mock chained methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock the query results
      let queryCount = 0;
      mockDb.offset.mockImplementation(() => {
        queryCount++;
        return Promise.resolve(mockRows);
      });
      mockDb.where.mockImplementation(() => {
        if (queryCount === 1) {
          // This is the count query (second query)
          return Promise.resolve([{ count: 1 }]);
        }
        return mockDb; // For the logs query, continue chaining
      });

      const result = await repository.search(filters);

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should search without filters', async () => {
      const mockRows = [
        {
          id: 'log-1',
          action: AuditAction.READ,
          timestamp: new Date(),
          success: true,
        },
      ];

      // Mock chained methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock the query results
      let queryCount = 0;
      mockDb.offset.mockImplementation(() => {
        queryCount++;
        return Promise.resolve(mockRows);
      });
      mockDb.where.mockImplementation(() => {
        if (queryCount === 1) {
          // This is the count query (second query)
          return Promise.resolve([{ count: 1 }]);
        }
        return mockDb; // For the logs query, continue chaining
      });

      const result = await repository.search({});

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getStatistics', () => {
    it('should get statistics with filters', async () => {
      const filters = {
        organizationId: 'org-456',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const mockStats = [{ total: 100, successful: 95, failed: 5 }];
      const mockActions = [
        { action: AuditAction.CREATE, count: 50 },
        { action: AuditAction.UPDATE, count: 30 },
      ];
      const mockResources = [
        { resourceType: AuditResourceType.WELL, count: 60 },
        { resourceType: AuditResourceType.AFE, count: 40 },
      ];
      const mockUsers = [
        { userId: 'user-1', count: 20 },
        { userId: 'user-2', count: 15 },
      ];
      const mockRecent = [
        {
          id: 'log-1',
          action: AuditAction.CREATE,
          timestamp: new Date(),
          success: true,
        },
      ];

      // Mock the chained query methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.groupBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock query results in sequence
      let queryIndex = 0;
      const queryResults = [
        mockStats,
        mockActions,
        mockResources,
        mockUsers,
        mockRecent,
      ];
      mockDb.then.mockImplementation((resolve: (value: any) => void) =>
        resolve(queryResults[queryIndex++]),
      );

      const result = await repository.getStatistics(filters);

      expect(result.totalLogs).toBe(100);
      expect(result.successfulActions).toBe(95);
      expect(result.failedActions).toBe(5);
      expect(result.actionsByType[AuditAction.CREATE]).toBe(50);
      expect(result.actionsByType[AuditAction.UPDATE]).toBe(30);
      expect(result.resourcesByType[AuditResourceType.WELL]).toBe(60);
      expect(result.topUsers).toHaveLength(2);
      expect(result.recentActivity).toHaveLength(1);
    });

    it('should get statistics without filters', async () => {
      const mockStats = [{ total: 50, successful: 48, failed: 2 }];

      // Mock chained methods
      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockReturnValue(mockDb);
      mockDb.groupBy.mockReturnValue(mockDb);
      mockDb.orderBy.mockReturnValue(mockDb);
      mockDb.limit.mockReturnValue(mockDb);

      // Mock query results in sequence
      let queryIndex = 0;
      const queryResults = [mockStats, [], [], [], []];
      mockDb.then.mockImplementation((resolve: (value: any) => void) =>
        resolve(queryResults[queryIndex++]),
      );

      const result = await repository.getStatistics();

      expect(result.totalLogs).toBe(50);
      expect(result.successfulActions).toBe(48);
      expect(result.failedActions).toBe(2);
      expect(result.actionsByType).toEqual({});
      expect(result.resourcesByType).toEqual({});
      expect(result.topUsers).toEqual([]);
      expect(result.recentActivity).toEqual([]);
    });
  });

  describe('archiveLogs', () => {
    it('should return count of logs that would be archived', async () => {
      const olderThan = new Date('2024-01-01');

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue([{ count: 150 }]);

      const result = await repository.archiveLogs(olderThan);

      expect(result).toBe(150);
      expect(mockDb.where).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('deleteLogs', () => {
    it('should delete logs older than specified date', async () => {
      const olderThan = new Date('2024-01-01');

      mockDb.delete.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue({ rowCount: 75 });

      const result = await repository.deleteLogs(olderThan);

      expect(result).toBe(75);
      expect(mockDb.delete).toHaveBeenCalledWith(auditLogs);
    });

    it('should return 0 when no rows affected', async () => {
      const olderThan = new Date('2024-01-01');

      mockDb.delete.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue({ rowCount: undefined });

      const result = await repository.deleteLogs(olderThan);

      expect(result).toBe(0);
    });
  });
});
