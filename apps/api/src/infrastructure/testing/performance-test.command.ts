import { CommandRunner } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PerformanceTestService,
  PerformanceTestConfig,
  PerformanceTestResult,
} from './performance-test.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

/**
 * Performance Test Suite Result Type
 */
interface PerformanceTestSuiteResult {
  overallPassed: boolean;
  results: PerformanceTestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageExecutionTime: number;
    totalExecutionTime: number;
  };
}

/**
 * Performance Test Command Options
 */
interface PerformanceTestOptions {
  iterations?: number;
  concurrent?: number;
  output?: string;
  verbose?: boolean;
  config?: string;
}

/**
 * Performance Test CLI Command
 * Allows running KAN-33 performance tests from command line
 *
 * Usage:
 * npm run performance-test
 * npm run performance-test -- --iterations 100 --concurrent 20 --output results.json
 */
export class PerformanceTestCommand extends CommandRunner {
  private readonly logger = new Logger(PerformanceTestCommand.name);

  constructor(
    private readonly performanceTestService: PerformanceTestService,
    private readonly configService: ConfigService,
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    // Call parent constructor - CommandRunner has no constructor parameters
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  async run(
    _passedParams: string[],
    options?: PerformanceTestOptions,
  ): Promise<void> {
    this.logger.log('🚀 Starting KAN-33 Performance Test Suite...');

    try {
      // Load configuration
      const config = await this.loadTestConfig(options);

      // Run performance tests
      const startTime = Date.now();
      const result = await this.performanceTestService.runPerformanceTestSuite(
        this.db,
        config,
      );
      const totalTime = Date.now() - startTime;

      // Display results
      this.displayResults(result, totalTime, options);

      // Save results if output specified
      if (options?.output) {
        await this.saveResults(result, options.output);
      }

      // Exit with appropriate code
      process.exit(result.overallPassed ? 0 : 1);
    } catch (error) {
      this.logger.error(
        '❌ Performance test suite failed:',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  }

  /**
   * Load test configuration from file or options
   */
  private async loadTestConfig(
    options?: PerformanceTestOptions,
  ): Promise<Partial<PerformanceTestConfig>> {
    let config: Partial<PerformanceTestConfig> = {};

    // Load from config file if specified
    if (options?.config) {
      try {
        const configPath = path.resolve(options.config);
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const configFile = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configFile) as Partial<PerformanceTestConfig>;
        this.logger.log(`📄 Loaded configuration from ${configPath}`);
      } catch (error) {
        this.logger.warn(
          `⚠️  Failed to load config file ${options.config}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }

    // Override with command line options
    if (options?.iterations) {
      config.testIterations = options.iterations;
    }

    if (options?.concurrent) {
      config.concurrentRequests = options.concurrent;
    }

    // Set defaults based on environment
    const environment = String(
      this.configService.get('NODE_ENV', 'development'),
    );
    if (environment === 'production') {
      config = {
        maxApiResponseTime: 200,
        maxDatabaseQueryTime: 50,
        testIterations: 200,
        concurrentRequests: 20,
        successRate: 0.95,
        p95Threshold: 150,
        p99Threshold: 300,
        ...config,
      };
    } else {
      config = {
        maxApiResponseTime: 300,
        maxDatabaseQueryTime: 100,
        testIterations: 50,
        concurrentRequests: 10,
        successRate: 0.9,
        p95Threshold: 200,
        p99Threshold: 500,
        ...config,
      };
    }

    if (options?.verbose) {
      this.logger.log('🔧 Test Configuration:', config);
    }

    return config;
  }

  /**
   * Display test results in a formatted way
   */
  private displayResults(
    result: PerformanceTestSuiteResult,
    totalTime: number,
    options?: PerformanceTestOptions,
  ): void {
    this.displayHeader();
    this.displayOverallSummary(result, totalTime);
    this.displayIndividualTestResults(result, options);
    this.displayKan33Validation(result);
    this.displayPerformanceRecommendations(result);
    this.displayFooter();
  }

  private displayHeader(): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 KAN-33 PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80));
  }

  private displayOverallSummary(
    result: PerformanceTestSuiteResult,
    totalTime: number,
  ): void {
    const status = result.overallPassed ? '✅ PASSED' : '❌ FAILED';
    const statusColor = result.overallPassed ? '\x1b[32m' : '\x1b[31m';
    console.log(`\n${statusColor}%s\x1b[0m`, `Overall Status: ${status}`);

    console.log(`\n📊 Summary:`);
    console.log(`   Total Tests: ${result.summary.totalTests}`);
    console.log(`   Passed: ${result.summary.passedTests}`);
    console.log(`   Failed: ${result.summary.failedTests}`);
    console.log(`   Total Execution Time: ${totalTime}ms`);
    console.log(
      `   Average Test Time: ${Math.round(result.summary.averageExecutionTime)}ms`,
    );
  }

  private displayIndividualTestResults(
    result: PerformanceTestSuiteResult,
    options?: PerformanceTestOptions,
  ): void {
    console.log(`\n📋 Individual Test Results:`);
    console.log('-'.repeat(80));

    for (const test of result.results) {
      const status = test.passed ? '✅' : '❌';
      const statusColor = test.passed ? '\x1b[32m' : '\x1b[31m';

      console.log(`\n${statusColor}${status} ${test.testName}\x1b[0m`);
      console.log(`   Execution Time: ${test.executionTime}ms`);
      console.log(`   Threshold: ${test.threshold}ms`);

      if (options?.verbose || !test.passed) {
        console.log(`   Query Count: ${test.details.queryCount}`);
        console.log(
          `   Average Query Time: ${Math.round(test.details.averageQueryTime)}ms`,
        );
        console.log(`   Slowest Query: ${test.details.slowestQuery}ms`);
        console.log(`   Fastest Query: ${test.details.fastestQuery}ms`);

        if (test.details.errors.length > 0) {
          console.log(`   Errors:`);
          test.details.errors.forEach((error: string) => {
            console.log(`     - ${error}`);
          });
        }
      }
    }
  }

  private displayKan33Validation(result: PerformanceTestSuiteResult): void {
    console.log(`\n🎯 KAN-33 Requirements Validation:`);
    console.log('-'.repeat(50));

    const dbTest = result.results.find(
      (r: PerformanceTestResult) => r.testName === 'Database Query Performance',
    );
    if (dbTest) {
      const dbStatus = dbTest.details.averageQueryTime <= 50 ? '✅' : '❌';
      console.log(
        `${dbStatus} Database Query Time: ${Math.round(dbTest.details.averageQueryTime)}ms (requirement: <50ms)`,
      );
    }
  }

  private displayPerformanceRecommendations(
    result: PerformanceTestSuiteResult,
  ): void {
    if (!result.overallPassed) {
      console.log(`\n💡 Performance Recommendations:`);
      console.log('-'.repeat(40));

      const failedTests = result.results.filter(
        (r: PerformanceTestResult) => !r.passed,
      );
      for (const test of failedTests) {
        console.log(`\n❌ ${test.testName}:`);
        this.displayTestRecommendations(test);
      }
    }
  }

  private displayTestRecommendations(test: PerformanceTestResult): void {
    if (test.testName.includes('Database Query')) {
      console.log(`   - Check if indexes are being used effectively`);
      console.log(`   - Consider query optimization`);
      console.log(`   - Verify connection pool configuration`);
    } else if (test.testName.includes('Pagination')) {
      console.log(`   - Ensure cursor-based pagination is implemented`);
      console.log(`   - Check if proper indexes exist for sorting columns`);
    } else if (test.testName.includes('Concurrent')) {
      console.log(`   - Review connection pool size and configuration`);
      console.log(`   - Check for database locks or contention`);
    }
  }

  private displayFooter(): void {
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Save results to JSON file
   */
  private async saveResults(
    result: PerformanceTestSuiteResult,
    outputPath: string,
  ): Promise<void> {
    try {
      const outputData = {
        timestamp: new Date().toISOString(),
        environment: String(this.configService.get('NODE_ENV', 'development')),
        kan33Compliance: result.overallPassed,
        summary: result.summary,
        results: result.results,
        metadata: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };

      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));
      this.logger.log(`💾 Results saved to ${outputPath}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to save results to ${outputPath}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  static parseIterations(val: string): number {
    return parseInt(val, 10);
  }

  static parseConcurrent(val: string): number {
    return parseInt(val, 10);
  }

  static parseOutput(val: string): string {
    return val;
  }

  static parseVerbose(): boolean {
    return true;
  }

  static parseConfig(val: string): string {
    return val;
  }
}
