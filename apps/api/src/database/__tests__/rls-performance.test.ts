import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from '../database.service';
import * as schema from '../schema';

describe('RLS Performance Impact Assessment', () => {
  let module: TestingModule;
  let databaseService: DatabaseService;
  let db: ReturnType<typeof databaseService.getDb>;

  // Test organization IDs
  const org1Id = '11111111-1111-1111-1111-111111111111';
  const org2Id = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [DatabaseService],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    await databaseService.onModuleInit();
    db = databaseService.getDb();
  });

  afterAll(async () => {
    try {
      await databaseService.clearOrganizationContext();
    } catch (error) {
      // Ignore errors during cleanup
    }

    await databaseService.onModuleDestroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clear any existing organization context first
    try {
      await databaseService.clearOrganizationContext();
    } catch (error) {
      // Ignore errors during cleanup
    }

    // Clean up test data before each test
    await db.delete(schema.wells);
    await db.delete(schema.users);
    await db.delete(schema.organizations);
  });

  describe('Performance Benchmarks', () => {
    it('should measure query performance with and without RLS context', async () => {
      // Create test organizations
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      // Create test data - 100 wells per organization
      const org1Wells = Array.from({ length: 100 }, (_, i) => ({
        organizationId: org1Id,
        apiNumber: `1234567890123${i.toString().padStart(1, '0')}`,
        wellName: `Org1 Well ${i + 1}`,
        wellType: 'oil' as const,
        status: 'active' as const,
      }));

      const org2Wells = Array.from({ length: 100 }, (_, i) => ({
        organizationId: org2Id,
        apiNumber: `9876543210987${i.toString().padStart(1, '0')}`,
        wellName: `Org2 Well ${i + 1}`,
        wellType: 'gas' as const,
        status: 'active' as const,
      }));

      await db.insert(schema.wells).values([...org1Wells, ...org2Wells]);

      // Benchmark 1: Query without RLS context (should see all 200 wells)
      const startWithoutRLS = performance.now();
      const allWells = await db.select().from(schema.wells);
      const endWithoutRLS = performance.now();
      const timeWithoutRLS = endWithoutRLS - startWithoutRLS;

      expect(allWells).toHaveLength(200);

      // Benchmark 2: Query with RLS context (should see only 100 wells)
      await databaseService.setOrganizationContext(org1Id);

      const startWithRLS = performance.now();
      const org1WellsResult = await db.select().from(schema.wells);
      const endWithRLS = performance.now();
      const timeWithRLS = endWithRLS - startWithRLS;

      expect(org1WellsResult).toHaveLength(100);

      // Performance analysis
      const performanceOverhead =
        ((timeWithRLS - timeWithoutRLS) / timeWithoutRLS) * 100;

      console.log('\n=== RLS Performance Impact Assessment ===');
      console.log(
        `Query without RLS: ${timeWithoutRLS.toFixed(2)}ms (200 wells returned)`,
      );
      console.log(
        `Query with RLS: ${timeWithRLS.toFixed(2)}ms (100 wells returned)`,
      );
      console.log(`Performance overhead: ${performanceOverhead.toFixed(2)}%`);
      console.log(
        `Absolute difference: ${(timeWithRLS - timeWithoutRLS).toFixed(2)}ms`,
      );

      // Performance should be reasonable (less than 100% overhead for this simple case)
      expect(performanceOverhead).toBeLessThan(100);
    });

    it('should measure complex query performance with RLS', async () => {
      // Create test data
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      // Create wells
      const wells = Array.from({ length: 50 }, (_, i) => ({
        organizationId: org1Id,
        apiNumber: `1234567890123${i.toString().padStart(2, '0')}`,
        wellName: `Well ${i + 1}`,
        wellType: 'oil' as const,
        status: 'active' as const,
      }));

      await db.insert(schema.wells).values(wells);

      // Set RLS context
      await databaseService.setOrganizationContext(org1Id);

      // Benchmark complex query with joins and filters
      const startComplex = performance.now();
      const complexQuery = await db
        .select({
          wellId: schema.wells.id,
          wellName: schema.wells.wellName,
          organizationName: schema.organizations.name,
        })
        .from(schema.wells)
        .innerJoin(schema.organizations, schema.wells.organizationId)
        .where(schema.wells.status)
        .limit(25);
      const endComplex = performance.now();
      const timeComplex = endComplex - startComplex;

      expect(complexQuery).toHaveLength(25);

      console.log('\n=== Complex Query Performance ===');
      console.log(
        `Complex query with RLS and joins: ${timeComplex.toFixed(2)}ms`,
      );
      console.log(`Results returned: ${complexQuery.length}`);

      // Complex queries should still be reasonably fast (under 50ms for this dataset)
      expect(timeComplex).toBeLessThan(50);
    });

    it('should measure index effectiveness with RLS', async () => {
      // Create test data
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      // Create many wells to test index effectiveness
      const wells = Array.from({ length: 500 }, (_, i) => ({
        organizationId: i < 250 ? org1Id : org2Id,
        apiNumber: `1234567890${i.toString().padStart(4, '0')}`,
        wellName: `Well ${i + 1}`,
        wellType: (i % 2 === 0 ? 'oil' : 'gas') as const,
        status: 'active' as const,
      }));

      await db.insert(schema.wells).values(wells);

      // Set RLS context
      await databaseService.setOrganizationContext(org1Id);

      // Test query that should benefit from organization_id index
      const startIndexed = performance.now();
      const indexedQuery = await db
        .select()
        .from(schema.wells)
        .where(schema.wells.wellType);
      const endIndexed = performance.now();
      const timeIndexed = endIndexed - startIndexed;

      expect(indexedQuery).toHaveLength(125); // 250 wells for org1, half are oil

      console.log('\n=== Index Effectiveness with RLS ===');
      console.log(`Indexed query with RLS: ${timeIndexed.toFixed(2)}ms`);
      console.log(
        `Results returned: ${indexedQuery.length} out of 250 org wells`,
      );

      // Indexed queries should be fast even with RLS
      expect(timeIndexed).toBeLessThan(25);
    });
  });

  describe('RLS Policy Optimization', () => {
    it('should document RLS policy recommendations', () => {
      const recommendations = {
        indexing: [
          'Ensure organization_id columns are indexed on all tenant tables',
          'Consider composite indexes on (organization_id, frequently_queried_column)',
          'Monitor query plans to ensure RLS policies use indexes effectively',
        ],
        queryOptimization: [
          'Use explicit WHERE clauses in addition to RLS for better query planning',
          'Avoid complex subqueries in RLS policies when possible',
          'Consider materialized views for complex multi-tenant aggregations',
        ],
        monitoring: [
          'Monitor query performance before and after RLS implementation',
          'Set up alerts for queries that exceed performance thresholds',
          'Regularly analyze slow query logs for RLS-related performance issues',
        ],
        scaling: [
          'Consider connection pooling to reduce role switching overhead',
          'Evaluate read replicas for tenant-specific reporting queries',
          'Monitor database CPU and memory usage under RLS load',
        ],
      };

      console.log('\n=== RLS Performance Optimization Recommendations ===');
      Object.entries(recommendations).forEach(([category, items]) => {
        console.log(`\n${category.toUpperCase()}:`);
        items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item}`);
        });
      });

      // This test always passes - it's for documentation
      expect(recommendations).toBeDefined();
    });
  });
});
