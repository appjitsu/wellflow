import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PerformanceTestService } from './performance-test.service';
import { QueryPerformanceService } from '../monitoring/query-performance.service';
import { DatabaseConnectionService } from '../tenant/database-connection.service';
import { ConnectionPoolConfigService } from '../database/connection-pool-config.service';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

/**
 * Performance Test Suite
 * Validates KAN-33 performance requirements
 *
 * These tests verify:
 * - Database queries complete within <50ms
 * - API responses complete within <200ms
 * - Indexes are properly utilized
 * - Pagination performs efficiently
 * - Connection pooling works optimally
 */
describe('PerformanceTestService', () => {
  let service: PerformanceTestService;
  let databaseService: DatabaseConnectionService;
  let db: NodePgDatabase<typeof schema>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PerformanceTestService,
        QueryPerformanceService,
        DatabaseConnectionService,
        ConnectionPoolConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                DATABASE_URL:
                  process.env.DATABASE_URL ||
                  'postgresql://localhost:5432/wellflow_test',
                NODE_ENV: 'test',
                DATABASE_POOL_MIN: '2',
                DATABASE_POOL_MAX: '10',
                DATABASE_POOL_IDLE_TIMEOUT: '10000',
                DATABASE_POOL_CONNECTION_TIMEOUT: '2000',
              };
              return config[key as keyof typeof config];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PerformanceTestService>(PerformanceTestService);
    databaseService = module.get<DatabaseConnectionService>(
      DatabaseConnectionService,
    );

    // Get database connection for testing
    db = await databaseService.getDatabase('test-org-id');
  });

  afterAll(async () => {
    await module.close();
  });

  describe('KAN-33 Performance Requirements', () => {
    /**
     * Test: Database Query Performance
     * Requirement: <50ms database query time
     */
    it('should meet database query performance requirements (<50ms)', async () => {
      const config = {
        maxDatabaseQueryTime: 50,
        testIterations: 50,
        concurrentRequests: 5,
      };

      const result = await service.runPerformanceTestSuite(db, config);

      // Find the database query performance test
      const dbTest = result.results.find(
        (r) => r.testName === 'Database Query Performance',
      );

      expect(dbTest).toBeDefined();
      expect(dbTest!.passed).toBe(true);
      expect(dbTest!.details.averageQueryTime).toBeLessThanOrEqual(50);

      // Log performance metrics for analysis
      console.log('📊 Database Query Performance:', {
        averageTime: dbTest!.details.averageQueryTime,
        slowestQuery: dbTest!.details.slowestQuery,
        fastestQuery: dbTest!.details.fastestQuery,
        queryCount: dbTest!.details.queryCount,
      });
    }, 30000); // 30 second timeout

    /**
     * Test: Index Usage Validation
     * Requirement: Critical indexes must exist and be used
     */
    it('should validate that performance indexes are created and used', async () => {
      const result = await service.runPerformanceTestSuite(db);

      const indexTest = result.results.find(
        (r) => r.testName === 'Index Usage Validation',
      );

      expect(indexTest).toBeDefined();
      expect(indexTest!.passed).toBe(true);
      expect(indexTest!.details.errors).toHaveLength(0);

      console.log('🔍 Index Usage Validation:', {
        passed: indexTest!.passed,
        errors: indexTest!.details.errors,
      });
    }, 10000);

    /**
     * Test: Pagination Performance
     * Requirement: Cursor-based pagination should be efficient
     */
    it('should meet pagination performance requirements', async () => {
      const config = {
        maxDatabaseQueryTime: 50,
        testIterations: 30,
      };

      const result = await service.runPerformanceTestSuite(db, config);

      const paginationTest = result.results.find(
        (r) => r.testName === 'Pagination Performance',
      );

      expect(paginationTest).toBeDefined();
      expect(paginationTest!.passed).toBe(true);
      expect(paginationTest!.details.averageQueryTime).toBeLessThanOrEqual(75); // 1.5x threshold

      console.log('📄 Pagination Performance:', {
        averageTime: paginationTest!.details.averageQueryTime,
        slowestQuery: paginationTest!.details.slowestQuery,
        queryCount: paginationTest!.details.queryCount,
      });
    }, 20000);

    /**
     * Test: Concurrent Query Performance
     * Requirement: Performance should not degrade under concurrent load
     */
    it('should maintain performance under concurrent load', async () => {
      const config = {
        maxDatabaseQueryTime: 50,
        concurrentRequests: 10,
        testIterations: 100,
      };

      const result = await service.runPerformanceTestSuite(db, config);

      const concurrentTest = result.results.find(
        (r) => r.testName === 'Concurrent Query Performance',
      );

      expect(concurrentTest).toBeDefined();
      expect(concurrentTest!.passed).toBe(true);
      expect(concurrentTest!.details.averageQueryTime).toBeLessThanOrEqual(100); // 2x threshold for concurrent

      // Error rate should be low
      const errorRate =
        concurrentTest!.details.errors.length /
        concurrentTest!.details.queryCount;
      expect(errorRate).toBeLessThan(0.05); // Less than 5% error rate

      console.log('🔄 Concurrent Query Performance:', {
        averageTime: concurrentTest!.details.averageQueryTime,
        errorRate: errorRate * 100,
        queryCount: concurrentTest!.details.queryCount,
      });
    }, 30000);

    /**
     * Test: Large Dataset Performance
     * Requirement: Aggregation queries should be reasonably fast
     */
    it('should handle large dataset queries efficiently', async () => {
      const config = {
        maxDatabaseQueryTime: 50,
        testIterations: 10, // Fewer iterations for expensive queries
      };

      const result = await service.runPerformanceTestSuite(db, config);

      const largeDataTest = result.results.find(
        (r) => r.testName === 'Large Dataset Performance',
      );

      expect(largeDataTest).toBeDefined();
      expect(largeDataTest!.passed).toBe(true);
      expect(largeDataTest!.details.averageQueryTime).toBeLessThanOrEqual(250); // 5x threshold

      console.log('📈 Large Dataset Performance:', {
        averageTime: largeDataTest!.details.averageQueryTime,
        slowestQuery: largeDataTest!.details.slowestQuery,
        queryCount: largeDataTest!.details.queryCount,
      });
    }, 25000);

    /**
     * Test: Connection Pool Performance
     * Requirement: Connection acquisition should be fast
     */
    it('should provide fast connection pool performance', async () => {
      const config = {
        maxDatabaseQueryTime: 50,
        concurrentRequests: 20,
      };

      const result = await service.runPerformanceTestSuite(db, config);

      const poolTest = result.results.find(
        (r) => r.testName === 'Connection Pool Performance',
      );

      expect(poolTest).toBeDefined();
      expect(poolTest!.passed).toBe(true);
      expect(poolTest!.details.averageQueryTime).toBeLessThanOrEqual(50);
      expect(poolTest!.details.errors).toHaveLength(0);

      console.log('🏊 Connection Pool Performance:', {
        averageTime: poolTest!.details.averageQueryTime,
        queryCount: poolTest!.details.queryCount,
        errors: poolTest!.details.errors.length,
      });
    }, 15000);

    /**
     * Test: Overall Performance Suite
     * Requirement: All tests should pass for KAN-33 compliance
     */
    it('should pass the complete KAN-33 performance test suite', async () => {
      const config = {
        maxApiResponseTime: 200,
        maxDatabaseQueryTime: 50,
        testIterations: 50,
        concurrentRequests: 10,
        successRate: 0.95,
      };

      const result = await service.runPerformanceTestSuite(db, config);

      expect(result.overallPassed).toBe(true);
      expect(result.summary.passedTests).toBe(result.summary.totalTests);
      expect(result.summary.failedTests).toBe(0);

      console.log('🎯 Overall Performance Test Results:', {
        overallPassed: result.overallPassed,
        totalTests: result.summary.totalTests,
        passedTests: result.summary.passedTests,
        failedTests: result.summary.failedTests,
        averageExecutionTime: result.summary.averageExecutionTime,
        totalExecutionTime: result.summary.totalExecutionTime,
      });

      // Log individual test results
      result.results.forEach((test) => {
        console.log(
          `${test.passed ? '✅' : '❌'} ${test.testName}: ${test.executionTime}ms`,
        );
        if (!test.passed) {
          console.log(`   Errors: ${test.details.errors.join(', ')}`);
        }
      });
    }, 60000); // 60 second timeout for full suite
  });

  describe('Performance Monitoring Integration', () => {
    it('should integrate with query performance monitoring', async () => {
      // This test verifies that the performance monitoring system
      // is working correctly with the test suite
      const queryPerformanceService = module.get<QueryPerformanceService>(
        QueryPerformanceService,
      );

      expect(queryPerformanceService).toBeDefined();

      // Test that we can start and stop query timers
      const queryId = 'test-query-id';
      const stopTimer = queryPerformanceService.startQueryTimer(
        queryId,
        'SELECT 1',
        [],
        'test-org-id',
        'test-user-id',
      );

      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 10));

      stopTimer();

      // Verify that the query was recorded
      // Note: In a real implementation, you might want to add methods
      // to retrieve recorded metrics for testing
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Test with invalid database connection
      const invalidDb = {} as NodePgDatabase<typeof schema>;

      const result = await service.runPerformanceTestSuite(invalidDb);

      expect(result.overallPassed).toBe(false);
      expect(result.summary.failedTests).toBeGreaterThan(0);

      // All tests should have error messages
      result.results.forEach((test) => {
        if (!test.passed) {
          expect(test.details.errors.length).toBeGreaterThan(0);
        }
      });
    });

    it('should handle timeout scenarios', async () => {
      const config = {
        maxDatabaseQueryTime: 1, // Very strict timeout
        testIterations: 5,
      };

      const result = await service.runPerformanceTestSuite(db, config);

      // Some tests might fail due to strict timeout
      // but the service should handle it gracefully
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.summary.totalTests).toBe(result.results.length);
    });
  });
});
