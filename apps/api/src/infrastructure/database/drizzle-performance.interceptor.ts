import { Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { QueryPerformanceService } from '../monitoring/query-performance.service';
import * as schema from '../../database/schema';

/**
 * Drizzle Performance Interceptor
 * Automatically tracks all database queries for performance monitoring
 * Implements Decorator Pattern to wrap Drizzle database operations
 */
@Injectable()
export class DrizzlePerformanceInterceptor {
  private readonly logger = new Logger(DrizzlePerformanceInterceptor.name);

  constructor(
    private readonly queryPerformanceService: QueryPerformanceService,
  ) {}

  /**
   * Wrap a Drizzle database instance with performance monitoring
   * Returns a proxy that intercepts all database operations
   */
  wrapDatabase(
    db: NodePgDatabase<typeof schema>,
    organizationId?: string,
    userId?: string,
  ): NodePgDatabase<typeof schema> {
    // Create a proxy to intercept database operations
    return new Proxy(db, {
      get: (target, prop, receiver) => {
        const originalMethod = Reflect.get(target, prop, receiver) as (
          ...args: unknown[]
        ) => unknown;

        // Only intercept methods that execute queries
        if (this.isQueryMethod(prop as string)) {
          return this.wrapQueryMethod(
            originalMethod,
            prop as string,
            organizationId,
            userId,
          );
        }

        return originalMethod;
      },
    });
  }

  /**
   * Check if a method executes database queries
   */
  private isQueryMethod(methodName: string): boolean {
    const queryMethods = [
      'select',
      'insert',
      'update',
      'delete',
      'execute',
      'query',
      'run',
      'all',
      'get',
      'values',
    ];

    return queryMethods.includes(methodName);
  }

  /**
   * Wrap a query method with performance monitoring
   */
  private wrapQueryMethod(
    originalMethod: (...args: unknown[]) => unknown,
    methodName: string,
    organizationId?: string,
    userId?: string,
  ) {
    return async (...args: unknown[]) => {
      // Dynamic import for ESM uuid package
      const { v4: uuidv4 } = await import('uuid');
      const queryId = uuidv4();
      const query = this.extractQueryFromArgs(methodName, args);

      // Start performance timer
      const stopTimer = this.queryPerformanceService.startQueryTimer(
        queryId,
        query,
        args,
        organizationId,
        userId,
      );

      try {
        const result = originalMethod.apply(this, args);

        // Handle both sync and async results
        if (
          result &&
          typeof result === 'object' &&
          'then' in result &&
          typeof result.then === 'function'
        ) {
          // Async operation
          return (result as Promise<unknown>)
            .then((data: unknown) => {
              stopTimer();
              this.logQuerySuccess(queryId, methodName, data);
              return data;
            })
            .catch((error: unknown) => {
              const executionTime = 0; // Timer will provide actual execution time
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              void this.queryPerformanceService.recordQueryError(
                queryId,
                query,
                errorMessage,
                executionTime,
                organizationId,
                userId,
              );
              this.logQueryError(queryId, methodName, error);
              throw error;
            });
        } else {
          // Sync operation
          stopTimer();
          this.logQuerySuccess(queryId, methodName, result);
          return result;
        }
      } catch (error: unknown) {
        const executionTime = 0; // Timer will provide actual execution time
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        void this.queryPerformanceService.recordQueryError(
          queryId,
          query,
          errorMessage,
          executionTime,
          organizationId,
          userId,
        );
        this.logQueryError(queryId, methodName, error);
        throw error;
      }
    };
  }

  /**
   * Extract query information from method arguments
   */
  private extractQueryFromArgs(methodName: string, args: unknown[]): string {
    // Simple query extraction to avoid cognitive complexity
    if (args.length > 0 && typeof args[0] === 'string') {
      return args[0];
    }

    return `${methodName} query`;
  }

  /**
   * Log successful query execution
   */
  private logQuerySuccess(
    queryId: string,
    methodName: string,
    result: unknown,
  ): void {
    let rowCount = 0;

    try {
      // Try to determine row count from result
      if (Array.isArray(result)) {
        rowCount = result.length;
      } else if (result && typeof result === 'object') {
        const resultObj = result as Record<string, unknown>;

        if (typeof resultObj.rowCount === 'number') {
          rowCount = resultObj.rowCount;
        } else if (Array.isArray(resultObj.rows)) {
          rowCount = resultObj.rows.length;
        } else if (typeof resultObj.length === 'number') {
          rowCount = resultObj.length;
        }
      }
    } catch {
      // Ignore errors in row count calculation - don't use the error variable
    }

    this.logger.debug(
      `Query ${queryId} (${methodName}) completed successfully with ${rowCount} rows`,
    );
  }

  /**
   * Log query execution error
   */
  private logQueryError(
    queryId: string,
    methodName: string,
    error: unknown,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    this.logger.error(
      `Query ${queryId} (${methodName}) failed: ${errorMessage}`,
      {
        queryId,
        methodName,
        error: errorMessage,
        stack: errorStack,
      },
    );
  }
}

/**
 * Performance-aware database factory
 * Creates database instances with automatic performance monitoring
 */
@Injectable()
export class PerformanceAwareDatabaseFactory {
  constructor(
    private readonly performanceInterceptor: DrizzlePerformanceInterceptor,
  ) {}

  /**
   * Create a performance-monitored database instance
   */
  createMonitoredDatabase(
    db: NodePgDatabase<typeof schema>,
    organizationId?: string,
    userId?: string,
  ): NodePgDatabase<typeof schema> {
    return this.performanceInterceptor.wrapDatabase(db, organizationId, userId);
  }
}

/**
 * Enhanced Drizzle Database Service with Performance Monitoring
 * Extends the base database service with automatic query tracking
 */
@Injectable()
export class PerformanceAwareDrizzleService {
  private readonly logger = new Logger(PerformanceAwareDrizzleService.name);

  constructor(
    private readonly databaseFactory: PerformanceAwareDatabaseFactory,
  ) {}

  /**
   * Get a performance-monitored database instance for a tenant
   */
  getDatabaseForTenant(
    baseDb: NodePgDatabase<typeof schema>,
    organizationId: string,
    userId?: string,
  ): NodePgDatabase<typeof schema> {
    return this.databaseFactory.createMonitoredDatabase(
      baseDb,
      organizationId,
      userId,
    );
  }

  /**
   * Get a performance-monitored database instance for system operations
   */
  getSystemDatabase(
    baseDb: NodePgDatabase<typeof schema>,
  ): NodePgDatabase<typeof schema> {
    return this.databaseFactory.createMonitoredDatabase(baseDb);
  }
}
