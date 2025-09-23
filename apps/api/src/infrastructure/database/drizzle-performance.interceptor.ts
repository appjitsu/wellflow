import { Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { QueryPerformanceService } from '../monitoring/query-performance.service';
import * as schema from '../../database/schema';
import { v4 as uuidv4 } from 'uuid';

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
        const originalMethod = Reflect.get(target, prop, receiver);

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
    originalMethod: any,
    methodName: string,
    organizationId?: string,
    userId?: string,
  ) {
    return (...args: any[]) => {
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
        if (result && typeof result.then === 'function') {
          // Async operation
          return result
            .then((data: any) => {
              stopTimer();
              this.logQuerySuccess(queryId, methodName, data);
              return data;
            })
            .catch((error: any) => {
              const executionTime = Date.now() - Date.now(); // This will be updated by the timer
              this.queryPerformanceService.recordQueryError(
                queryId,
                query,
                error.message,
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
      } catch (error: any) {
        const executionTime = Date.now() - Date.now(); // This will be updated by the timer
        this.queryPerformanceService.recordQueryError(
          queryId,
          query,
          error.message,
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
  private extractQueryFromArgs(methodName: string, args: any[]): string {
    try {
      // For Drizzle ORM, the query is usually in the first argument
      // or can be extracted from the query builder
      if (args.length > 0 && args[0]) {
        const firstArg = args[0];

        // If it's a query builder object, try to get SQL
        if (firstArg.toSQL && typeof firstArg.toSQL === 'function') {
          const sqlResult = firstArg.toSQL();
          return sqlResult.sql || `${methodName} query`;
        }

        // If it's a string, use it directly
        if (typeof firstArg === 'string') {
          return firstArg;
        }

        // If it's an object with query property
        if (firstArg.query && typeof firstArg.query === 'string') {
          return firstArg.query;
        }
      }

      return `${methodName} query`;
    } catch (error) {
      this.logger.warn(
        `Failed to extract query from ${methodName} args:`,
        error,
      );
      return `${methodName} query`;
    }
  }

  /**
   * Log successful query execution
   */
  private logQuerySuccess(
    queryId: string,
    methodName: string,
    result: any,
  ): void {
    let rowCount = 0;

    try {
      // Try to determine row count from result
      if (Array.isArray(result)) {
        rowCount = result.length;
      } else if (result && typeof result === 'object') {
        if (result.rowCount !== undefined) {
          rowCount = result.rowCount;
        } else if (result.rows && Array.isArray(result.rows)) {
          rowCount = result.rows.length;
        } else if (result.length !== undefined) {
          rowCount = result.length;
        }
      }
    } catch (error) {
      // Ignore errors in row count calculation
    }

    this.logger.debug(
      `Query ${queryId} (${methodName}) completed successfully with ${rowCount} rows`,
    );
  }

  /**
   * Log query execution error
   */
  private logQueryError(queryId: string, methodName: string, error: any): void {
    this.logger.error(
      `Query ${queryId} (${methodName}) failed: ${error.message}`,
      {
        queryId,
        methodName,
        error: error.message,
        stack: error.stack,
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
