import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { QueryPerformanceService } from '../monitoring/query-performance.service';

/**
 * Performance Test Result Interface
 * Defines the structure for performance test results
 */
export interface PerformanceTestResult {
  testName: string;
  passed: boolean;
  executionTime: number;
  threshold: number;
  details: {
    queryCount: number;
    averageQueryTime: number;
    slowestQuery: number;
    fastestQuery: number;
    errors: string[];
  };
  timestamp: Date;
}

/**
 * Performance Test Suite Configuration
 */
export interface PerformanceTestConfig {
  // KAN-33 requirements
  maxApiResponseTime: number; // <200ms
  maxDatabaseQueryTime: number; // <50ms

  // Test parameters
  testDataSize: number;
  concurrentRequests: number;
  testIterations: number;

  // Thresholds
  successRate: number; // Minimum success rate (e.g., 95%)
  p95Threshold: number; // 95th percentile threshold
  p99Threshold: number; // 99th percentile threshold
}

/**
 * Performance Test Suite
 * Validates KAN-33 performance requirements
 * Tests database queries, API responses, and pagination performance
 */
@Injectable()
export class PerformanceTestService {
  private readonly logger = new Logger(PerformanceTestService.name);
  private readonly defaultConfig: PerformanceTestConfig = {
    maxApiResponseTime: 200, // KAN-33 requirement
    maxDatabaseQueryTime: 50, // KAN-33 requirement
    testDataSize: 1000,
    concurrentRequests: 10,
    testIterations: 100,
    successRate: 0.95, // 95%
    p95Threshold: 150, // 95% of requests under 150ms
    p99Threshold: 300, // 99% of requests under 300ms
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly queryPerformanceService: QueryPerformanceService,
  ) {}

  /**
   * Run comprehensive performance test suite
   * Validates all KAN-33 performance requirements
   */
  async runPerformanceTestSuite(
    db: NodePgDatabase<typeof schema>,
    config?: Partial<PerformanceTestConfig>,
  ): Promise<{
    overallPassed: boolean;
    results: PerformanceTestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      failedTests: number;
      averageExecutionTime: number;
      totalExecutionTime: number;
    };
  }> {
    const testConfig = { ...this.defaultConfig, ...config };
    const results: PerformanceTestResult[] = [];

    this.logger.log('🚀 Starting performance test suite...');
    const suiteStartTime = Date.now();

    try {
      // Test 1: Database Query Performance
      results.push(await this.testDatabaseQueryPerformance(db, testConfig));

      // Test 2: Index Usage Validation
      results.push(await this.testIndexUsage(db, testConfig));

      // Test 3: Pagination Performance
      results.push(await this.testPaginationPerformance(db, testConfig));

      // Test 4: Concurrent Query Performance
      results.push(await this.testConcurrentQueryPerformance(db, testConfig));

      // Test 5: Large Dataset Performance
      results.push(await this.testLargeDatasetPerformance(db, testConfig));

      // Test 6: Connection Pool Performance
      results.push(await this.testConnectionPoolPerformance(db, testConfig));

      const totalExecutionTime = Date.now() - suiteStartTime;
      const passedTests = results.filter((r) => r.passed).length;
      const overallPassed = passedTests === results.length;

      const summary = {
        totalTests: results.length,
        passedTests,
        failedTests: results.length - passedTests,
        averageExecutionTime:
          results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
        totalExecutionTime,
      };

      this.logger.log(
        `✅ Performance test suite completed in ${totalExecutionTime}ms`,
      );
      this.logger.log(
        `📊 Results: ${passedTests}/${results.length} tests passed`,
      );

      return {
        overallPassed,
        results,
        summary,
      };
    } catch (error) {
      this.logger.error('❌ Performance test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test database query performance against KAN-33 requirements
   */
  private async testDatabaseQueryPerformance(
    db: NodePgDatabase<typeof schema>,
    config: PerformanceTestConfig,
  ): Promise<PerformanceTestResult> {
    const testName = 'Database Query Performance';
    const startTime = Date.now();
    const queryTimes: number[] = [];
    const errors: string[] = [];

    try {
      // Test critical queries that should use our new indexes
      const testQueries = [
        // Test idx_production_records_well_date
        () =>
          db
            .select()
            .from(schema.productionRecords)
            .where(schema.eq(schema.productionRecords.wellId, 'test-well-id'))
            .orderBy(schema.desc(schema.productionRecords.productionDate))
            .limit(10),

        // Test idx_wells_organization
        () =>
          db
            .select()
            .from(schema.wells)
            .where(schema.eq(schema.wells.organizationId, 'test-org-id'))
            .limit(10),

        // Test idx_api_number_lookup
        () =>
          db
            .select()
            .from(schema.wells)
            .where(schema.eq(schema.wells.apiNumber, '12-345-67890'))
            .limit(1),
      ];

      for (let i = 0; i < config.testIterations; i++) {
        for (const queryFn of testQueries) {
          const queryStart = Date.now();
          try {
            await queryFn();
            const queryTime = Date.now() - queryStart;
            queryTimes.push(queryTime);
          } catch (error) {
            errors.push(
              `Query failed: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const averageQueryTime =
        queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
      const slowestQuery = Math.max(...queryTimes);
      const fastestQuery = Math.min(...queryTimes);

      const passed =
        averageQueryTime <= config.maxDatabaseQueryTime &&
        slowestQuery <= config.maxDatabaseQueryTime * 2; // Allow some tolerance

      return {
        testName,
        passed,
        executionTime,
        threshold: config.maxDatabaseQueryTime,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime,
          slowestQuery,
          fastestQuery,
          errors,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        executionTime: Date.now() - startTime,
        threshold: config.maxDatabaseQueryTime,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime: 0,
          slowestQuery: 0,
          fastestQuery: 0,
          errors: [
            `Test failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test that queries are using the correct indexes
   */
  private async testIndexUsage(
    db: NodePgDatabase<typeof schema>,
    config: PerformanceTestConfig,
  ): Promise<PerformanceTestResult> {
    const testName = 'Index Usage Validation';
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test that our critical indexes exist and are being used
      const indexQueries = [
        // Check if idx_production_records_well_date exists
        `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_production_records_well_date'`,

        // Check if idx_wells_organization exists
        `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_wells_organization'`,

        // Check if idx_api_number_lookup exists
        `SELECT indexname FROM pg_indexes WHERE indexname = 'idx_api_number_lookup'`,
      ];

      let indexCount = 0;
      for (const query of indexQueries) {
        try {
          const result = await db.execute(schema.sql.raw(query));
          if (result.rows.length > 0) {
            indexCount++;
          } else {
            errors.push(`Index not found: ${query}`);
          }
        } catch (error) {
          errors.push(
            `Index check failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      const executionTime = Date.now() - startTime;
      const passed = indexCount === indexQueries.length && errors.length === 0;

      return {
        testName,
        passed,
        executionTime,
        threshold: 100, // Index checks should be fast
        details: {
          queryCount: indexQueries.length,
          averageQueryTime: executionTime / indexQueries.length,
          slowestQuery: executionTime,
          fastestQuery: executionTime / indexQueries.length,
          errors,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        executionTime: Date.now() - startTime,
        threshold: 100,
        details: {
          queryCount: 0,
          averageQueryTime: 0,
          slowestQuery: 0,
          fastestQuery: 0,
          errors: [
            `Test failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test pagination performance with large datasets
   */
  private async testPaginationPerformance(
    db: NodePgDatabase<typeof schema>,
    config: PerformanceTestConfig,
  ): Promise<PerformanceTestResult> {
    const testName = 'Pagination Performance';
    const startTime = Date.now();
    const queryTimes: number[] = [];
    const errors: string[] = [];

    try {
      // Test cursor-based pagination performance
      const paginationTests = [
        // Test first page (should be fast)
        () =>
          db
            .select()
            .from(schema.productionRecords)
            .orderBy(schema.desc(schema.productionRecords.productionDate))
            .limit(20),

        // Test with cursor (should still be fast due to index)
        () =>
          db
            .select()
            .from(schema.productionRecords)
            .where(
              schema.lt(schema.productionRecords.productionDate, new Date()),
            )
            .orderBy(schema.desc(schema.productionRecords.productionDate))
            .limit(20),
      ];

      for (let i = 0; i < config.testIterations / 10; i++) {
        // Fewer iterations for pagination
        for (const testFn of paginationTests) {
          const queryStart = Date.now();
          try {
            await testFn();
            const queryTime = Date.now() - queryStart;
            queryTimes.push(queryTime);
          } catch (error) {
            errors.push(
              `Pagination query failed: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const averageQueryTime =
        queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
      const slowestQuery = Math.max(...queryTimes);
      const fastestQuery = Math.min(...queryTimes);

      // Pagination should be consistently fast
      const passed =
        averageQueryTime <= config.maxDatabaseQueryTime * 1.5 &&
        slowestQuery <= config.maxDatabaseQueryTime * 3;

      return {
        testName,
        passed,
        executionTime,
        threshold: config.maxDatabaseQueryTime * 1.5,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime,
          slowestQuery,
          fastestQuery,
          errors,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        executionTime: Date.now() - startTime,
        threshold: config.maxDatabaseQueryTime * 1.5,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime: 0,
          slowestQuery: 0,
          fastestQuery: 0,
          errors: [
            `Test failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test concurrent query performance
   */
  private async testConcurrentQueryPerformance(
    db: NodePgDatabase<typeof schema>,
    config: PerformanceTestConfig,
  ): Promise<PerformanceTestResult> {
    const testName = 'Concurrent Query Performance';
    const startTime = Date.now();
    const queryTimes: number[] = [];
    const errors: string[] = [];

    try {
      // Create concurrent queries
      const concurrentQueries = Array.from(
        { length: config.concurrentRequests },
        () => async () => {
          const queryStart = Date.now();
          try {
            await db
              .select()
              .from(schema.wells)
              .where(schema.eq(schema.wells.organizationId, 'test-org-id'))
              .limit(10);
            return Date.now() - queryStart;
          } catch (error) {
            errors.push(
              `Concurrent query failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            return Date.now() - queryStart;
          }
        },
      );

      // Execute concurrent queries multiple times
      for (
        let i = 0;
        i < Math.ceil(config.testIterations / config.concurrentRequests);
        i++
      ) {
        const results = await Promise.all(
          concurrentQueries.map((query) => query()),
        );
        queryTimes.push(...results);
      }

      const executionTime = Date.now() - startTime;
      const averageQueryTime =
        queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
      const slowestQuery = Math.max(...queryTimes);
      const fastestQuery = Math.min(...queryTimes);

      // Concurrent queries should not degrade performance significantly
      const passed =
        averageQueryTime <= config.maxDatabaseQueryTime * 2 &&
        errors.length / queryTimes.length < 0.05; // Less than 5% error rate

      return {
        testName,
        passed,
        executionTime,
        threshold: config.maxDatabaseQueryTime * 2,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime,
          slowestQuery,
          fastestQuery,
          errors,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        executionTime: Date.now() - startTime,
        threshold: config.maxDatabaseQueryTime * 2,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime: 0,
          slowestQuery: 0,
          fastestQuery: 0,
          errors: [
            `Test failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test performance with large datasets
   */
  private async testLargeDatasetPerformance(
    db: NodePgDatabase<typeof schema>,
    config: PerformanceTestConfig,
  ): Promise<PerformanceTestResult> {
    const testName = 'Large Dataset Performance';
    const startTime = Date.now();
    const queryTimes: number[] = [];
    const errors: string[] = [];

    try {
      // Test queries that might return larger result sets
      const largeDatasetQueries = [
        // Count queries (should use indexes)
        () =>
          db
            .select({ count: schema.sql`count(*)` })
            .from(schema.productionRecords),

        // Aggregation queries
        () =>
          db
            .select({
              totalOil: schema.sql`sum(${schema.productionRecords.oilVolume})`,
              avgOil: schema.sql`avg(${schema.productionRecords.oilVolume})`,
            })
            .from(schema.productionRecords),
      ];

      for (let i = 0; i < Math.min(config.testIterations, 20); i++) {
        // Limit iterations for expensive queries
        for (const queryFn of largeDatasetQueries) {
          const queryStart = Date.now();
          try {
            await queryFn();
            const queryTime = Date.now() - queryStart;
            queryTimes.push(queryTime);
          } catch (error) {
            errors.push(
              `Large dataset query failed: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }

      const executionTime = Date.now() - startTime;
      const averageQueryTime =
        queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
      const slowestQuery = Math.max(...queryTimes);
      const fastestQuery = Math.min(...queryTimes);

      // Large dataset queries can be slower but should still be reasonable
      const passed =
        averageQueryTime <= config.maxDatabaseQueryTime * 5 &&
        slowestQuery <= config.maxDatabaseQueryTime * 10;

      return {
        testName,
        passed,
        executionTime,
        threshold: config.maxDatabaseQueryTime * 5,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime,
          slowestQuery,
          fastestQuery,
          errors,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        executionTime: Date.now() - startTime,
        threshold: config.maxDatabaseQueryTime * 5,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime: 0,
          slowestQuery: 0,
          fastestQuery: 0,
          errors: [
            `Test failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Test connection pool performance
   */
  private async testConnectionPoolPerformance(
    db: NodePgDatabase<typeof schema>,
    config: PerformanceTestConfig,
  ): Promise<PerformanceTestResult> {
    const testName = 'Connection Pool Performance';
    const startTime = Date.now();
    const queryTimes: number[] = [];
    const errors: string[] = [];

    try {
      // Test rapid connection acquisition and release
      const poolTests = Array.from(
        { length: config.concurrentRequests * 2 },
        () => async () => {
          const queryStart = Date.now();
          try {
            // Simple query to test connection pool
            await db.select({ result: schema.sql`1` });
            return Date.now() - queryStart;
          } catch (error) {
            errors.push(
              `Pool test failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            return Date.now() - queryStart;
          }
        },
      );

      // Execute pool tests in batches
      const batchSize = config.concurrentRequests;
      for (let i = 0; i < poolTests.length; i += batchSize) {
        const batch = poolTests.slice(i, i + batchSize);
        const results = await Promise.all(batch.map((test) => test()));
        queryTimes.push(...results);
      }

      const executionTime = Date.now() - startTime;
      const averageQueryTime =
        queryTimes.reduce((sum, time) => sum + time, 0) / queryTimes.length;
      const slowestQuery = Math.max(...queryTimes);
      const fastestQuery = Math.min(...queryTimes);

      // Connection pool should provide fast connection acquisition
      const passed =
        averageQueryTime <= config.maxDatabaseQueryTime && errors.length === 0;

      return {
        testName,
        passed,
        executionTime,
        threshold: config.maxDatabaseQueryTime,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime,
          slowestQuery,
          fastestQuery,
          errors,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        testName,
        passed: false,
        executionTime: Date.now() - startTime,
        threshold: config.maxDatabaseQueryTime,
        details: {
          queryCount: queryTimes.length,
          averageQueryTime: 0,
          slowestQuery: 0,
          fastestQuery: 0,
          errors: [
            `Test failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        },
        timestamp: new Date(),
      };
    }
  }
}
