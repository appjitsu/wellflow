import {
  QueryBuilder,
  QueryBuilderFactory,
  QueryUtils,
} from '../query-builder';
import { organizations } from '../../../database/schema';
import { eq } from 'drizzle-orm';
import '../../../database/__tests__/env';

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder<typeof organizations>;
  let mockDb: any;

  beforeEach(() => {
    // Mock database connection with proper chaining
    const mockQueryResult = [{ id: 'test-id', name: 'Test Org' }];
    const mockCountResult = [{ count: '5' }];

    // Create a chainable mock that behaves like Drizzle's query builder
    const createChainableMock = (finalResult: unknown[]) => {
      // Create a class that extends Promise and has chaining methods
      class ChainablePromise extends Promise<unknown[]> {
        where(_args: any[]) {
          return this;
        }
        orderBy(_args: any[]) {
          return this;
        }
        offset(_args: any[]) {
          return this;
        }
        limit(_args: any[]) {
          return this;
        }
      }

      // Create a resolved promise with chaining methods
      return ChainablePromise.resolve(finalResult);
    };

    mockDb = {
      select: jest.fn().mockImplementation((fields?: unknown) => {
        const isCountQuery =
          fields &&
          typeof fields === 'object' &&
          !Array.isArray(fields) &&
          'count' in fields;
        const mockResult = isCountQuery ? mockCountResult : mockQueryResult;

        return {
          from: jest.fn().mockReturnValue(createChainableMock(mockResult)),
        };
      }),
      execute: jest.fn().mockResolvedValue([]),
    };

    queryBuilder = new QueryBuilder(mockDb, organizations);
  });

  describe('where conditions', () => {
    it('should add where condition', async () => {
      await queryBuilder.where(eq(organizations.name, 'Test')).execute();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should add multiple where conditions with AND', async () => {
      await queryBuilder
        .where(eq(organizations.name, 'Test'))
        .andWhere(eq(organizations.email, 'test@example.com'))
        .execute();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should add OR where condition', async () => {
      await queryBuilder
        .where(eq(organizations.name, 'Test'))
        .orWhere(eq(organizations.name, 'Other'))
        .execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('organization filtering', () => {
    it('should filter by organization ID', async () => {
      await queryBuilder.forOrganization('org-123').execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('date range filtering', () => {
    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await queryBuilder.dateRange('createdAt', startDate, endDate).execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('text search', () => {
    it('should perform case-insensitive search', async () => {
      await queryBuilder.search('name', 'test query').execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('array filtering', () => {
    it('should filter by array of values', async () => {
      await queryBuilder.whereIn('id', ['id1', 'id2', 'id3']).execute();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle empty array', async () => {
      await queryBuilder.whereIn('id', []).execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('null filtering', () => {
    it('should filter by null values', async () => {
      await queryBuilder.whereNull('deletedAt').execute();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should filter by non-null values', async () => {
      await queryBuilder.whereNotNull('email').execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('ordering', () => {
    it('should order by field ascending', async () => {
      await queryBuilder.orderBy('name', 'asc').execute();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should order by field descending', async () => {
      await queryBuilder.orderBy('createdAt', 'desc').execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    it('should apply limit', async () => {
      await queryBuilder.limit(10).execute();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should apply offset', async () => {
      await queryBuilder.offset(20).execute();

      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should apply both limit and offset', async () => {
      await queryBuilder.limit(10).offset(20).execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('field selection', () => {
    it('should select specific fields', async () => {
      await queryBuilder
        .select({ id: organizations.id, name: organizations.name })
        .execute();

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('execution methods', () => {
    it('should execute and return results', async () => {
      const result = await queryBuilder.execute();

      expect(result).toEqual([{ id: 'test-id', name: 'Test Org' }]);
    });

    it('should return first result', async () => {
      const result = await queryBuilder.first();

      expect(result).toEqual({ id: 'test-id', name: 'Test Org' });
    });

    it('should return null when no results', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await queryBuilder.first();
      expect(result).toBeNull();
    });

    it('should count results', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([{ count: '5' }]),
      });

      const result = await queryBuilder.count();
      expect(result).toBe(5);
    });

    it('should paginate results', async () => {
      // Create a fresh query builder for this test
      const mockQueryResult = [{ id: 'test-id', name: 'Test Org' }];
      const mockCountResult = [{ count: '25' }];

      // Simple mock that returns chainable promises
      const createPaginateMock = (finalResult: unknown[]) => {
        class PaginatePromise extends Promise<unknown[]> {
          where() {
            return this;
          }
          offset() {
            return this;
          }
          limit() {
            return this;
          }
        }
        return PaginatePromise.resolve(finalResult);
      };

      const testMockDb = {
        select: jest.fn().mockImplementation((fields?: any) => {
          const isCountQuery = fields && fields.count;
          const mockResult = isCountQuery ? mockCountResult : mockQueryResult;

          return {
            from: jest.fn().mockReturnValue(createPaginateMock(mockResult)),
          };
        }),
      };

      const testQueryBuilder = new QueryBuilder(
        testMockDb as any,
        organizations,
      );
      const result = await testQueryBuilder.paginate(2, 10);

      expect(result).toEqual({
        data: [{ id: 'test-id', name: 'Test Org' }],
        total: 25,
        page: 2,
        pageSize: 10,
        totalPages: 3,
      });
    });
  });
});

describe('QueryBuilderFactory', () => {
  let factory: QueryBuilderFactory;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {};
    factory = new QueryBuilderFactory(mockDb);
  });

  it('should create organization query builder', () => {
    const builder = factory.organizations();
    expect(builder).toBeInstanceOf(QueryBuilder);
  });

  it('should create wells query builder', () => {
    const builder = factory.wells();
    expect(builder).toBeInstanceOf(QueryBuilder);
  });

  it('should create production records query builder', () => {
    const builder = factory.productionRecords();
    expect(builder).toBeInstanceOf(QueryBuilder);
  });

  it('should create AFE query builder', () => {
    const builder = factory.afes();
    expect(builder).toBeInstanceOf(QueryBuilder);
  });

  it('should create generic table query builder', () => {
    const builder = factory.table(organizations);
    expect(builder).toBeInstanceOf(QueryBuilder);
  });
});

describe('QueryUtils', () => {
  let queryUtils: QueryUtils;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn().mockResolvedValue([]),
    };
    queryUtils = new QueryUtils(mockDb);
  });

  it('should execute raw SQL query', async () => {
    const query = 'SELECT * FROM organizations WHERE name = $1';
    const params = ['Test'];

    await queryUtils.raw(query, params);

    expect(mockDb.execute).toHaveBeenCalled();
  });

  it('should get connection info', async () => {
    mockDb.execute
      .mockResolvedValueOnce([{ version: 'PostgreSQL 14.0' }])
      .mockResolvedValueOnce([{ current_database: 'wellflow' }])
      .mockResolvedValueOnce([{ current_user: 'postgres' }]);

    const result = await queryUtils.getConnectionInfo();

    expect(result).toEqual({
      version: 'PostgreSQL 14.0',
      currentDatabase: 'wellflow',
      currentUser: 'postgres',
    });
  });
});
