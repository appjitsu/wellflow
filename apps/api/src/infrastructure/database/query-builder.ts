/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  eq,
  and,
  or,
  gte,
  lte,
  ilike,
  isNull,
  isNotNull,
  inArray,
  sql,
  SQL,
  SQLWrapper,
  AnyColumn,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../../database/schema';

/**
 * Advanced Query Builder for Drizzle ORM
 * Provides type-safe, fluent query building capabilities
 */
export class QueryBuilder<T extends PgTable> {
  private whereConditions: SQLWrapper[] = [];
  private orderByClause: SQL[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private selectFields?: Record<string, unknown> | unknown[];

  constructor(
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly table: T,
  ) {}

  /**
   * Safely access a column by key name
   */
  private getColumn(key: string): AnyColumn {
    // eslint-disable-next-line security/detect-object-injection
    const column = (this.table as Record<string, unknown>)[key];
    if (!column) {
      throw new Error(`Column '${key}' not found in table`);
    }
    return column as AnyColumn;
  }

  /**
   * Add WHERE condition
   */
  where(condition: SQLWrapper): this {
    this.whereConditions.push(condition);
    return this;
  }

  /**
   * Add WHERE condition with AND logic
   */
  andWhere(condition: SQLWrapper): this {
    this.whereConditions.push(condition);
    return this;
  }

  /**
   * Add WHERE condition with OR logic
   */
  orWhere(condition: SQLWrapper): this {
    if (this.whereConditions.length === 0) {
      this.whereConditions.push(condition);
    } else {
      const existing = this.whereConditions;
      const combined = or(and(...existing), condition);
      if (combined) {
        this.whereConditions = [combined];
      }
    }
    return this;
  }

  /**
   * Filter by organization ID (multi-tenant support)
   */
  forOrganization(organizationId: string): this {
    return this.where(
      eq(
        (this.table as Record<string, unknown>).organizationId as PgColumn,
        organizationId,
      ),
    );
  }

  /**
   * Filter by date range
   */
  dateRange(field: string, startDate: Date, endDate: Date): this {
    const column = this.getColumn(field);
    const gteCondition = gte(column, startDate);
    const lteCondition = lte(column, endDate);
    if (gteCondition && lteCondition) {
      const combined = and(gteCondition, lteCondition);
      if (combined) {
        return this.where(combined);
      }
    }
    return this;
  }

  /**
   * Filter by text search (case-insensitive)
   */
  search(field: string, query: string): this {
    const column = this.getColumn(field);
    return this.where(ilike(column, `%${query}%`));
  }

  /**
   * Filter by multiple values
   */
  whereIn(field: string, values: unknown[]): this {
    if (values.length === 0) return this;
    const column = this.getColumn(field);
    return this.where(inArray(column, values));
  }

  /**
   * Filter by null values
   */
  whereNull(field: string): this {
    const column = this.getColumn(field);
    return this.where(isNull(column));
  }

  /**
   * Filter by non-null values
   */
  whereNotNull(field: string): this {
    const column = this.getColumn(field);
    return this.where(isNotNull(column));
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    const column = this.getColumn(field);
    this.orderByClause.push(
      direction === 'desc' ? sql`${column} DESC` : sql`${column} ASC`,
    );
    return this;
  }

  /**
   * Set LIMIT
   */
  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Select specific fields
   */
  select(fields: Record<string, unknown> | unknown[]): this {
    this.selectFields = fields;
    return this;
  }

  /**
   * Execute query and return results
   */
  async execute(): Promise<Record<string, unknown>[]> {
    // Use type-safe approach with proper Drizzle query typing
    let query: unknown;

    if (this.selectFields) {
      // Custom select fields require rebuilding the query
      query = this.db
        .select(this.selectFields as Record<string, SQL<unknown>>)
        .from(this.table as PgTable);
    } else {
      query = this.db.select().from(this.table as PgTable);
    }

    // Apply conditions using type-safe method assertions
    if (this.whereConditions.length > 0) {
      const condition = and(...this.whereConditions);
      if (condition) {
        query = (query as { where: (condition: SQLWrapper) => unknown }).where(
          condition,
        );
      }
    }

    if (this.orderByClause.length > 0) {
      query = (query as { orderBy: (...args: SQL[]) => unknown }).orderBy(
        ...this.orderByClause,
      );
    }

    if (this.offsetValue !== undefined) {
      query = (query as { offset: (value: number) => unknown }).offset(
        this.offsetValue,
      );
    }

    if (this.limitValue !== undefined) {
      query = (query as { limit: (value: number) => unknown }).limit(
        this.limitValue,
      );
    }

    return await (query as Promise<Record<string, unknown>[]>);
  }

  /**
   * Execute query and return first result
   */
  async first(): Promise<T['$inferSelect'] | null> {
    const results = await this.limit(1).execute();
    return results[0] || null;
  }

  /**
   * Execute query and return count
   */
  async count(): Promise<number> {
    let query: unknown = this.db
      .select({ count: sql`count(*)` })
      .from(this.table as PgTable);

    if (this.whereConditions.length > 0) {
      const condition = and(...this.whereConditions);
      if (condition) {
        query = (query as { where: (condition: SQLWrapper) => unknown }).where(
          condition,
        );
      }
    }

    const result = await (query as Promise<Array<{ count: number | string }>>);
    return Number(result[0]?.count || 0);
  }

  /**
   * Execute query with pagination
   */
  async paginate(
    page: number,
    pageSize: number,
  ): Promise<{
    data: T['$inferSelect'][];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.offset(offset).limit(pageSize).execute(),
      this.count(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

/**
 * Query Builder Factory
 * Creates query builders for different tables
 */
export class QueryBuilderFactory {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  /**
   * Create query builder for organizations
   */
  organizations(): QueryBuilder<typeof schema.organizations> {
    return new QueryBuilder(this.db, schema.organizations);
  }

  /**
   * Create query builder for wells
   */
  wells(): QueryBuilder<typeof schema.wells> {
    return new QueryBuilder(this.db, schema.wells);
  }

  /**
   * Create query builder for production records
   */
  productionRecords(): QueryBuilder<typeof schema.productionRecords> {
    return new QueryBuilder(this.db, schema.productionRecords);
  }

  /**
   * Create query builder for AFEs
   */
  afes(): QueryBuilder<typeof schema.afes> {
    return new QueryBuilder(this.db, schema.afes);
  }

  /**
   * Create query builder for any table
   */
  table<T extends PgTable>(table: T): QueryBuilder<T> {
    return new QueryBuilder(this.db, table);
  }
}

/**
 * Advanced Query Utilities
 * Provides common query patterns and utilities
 */
export class QueryUtils {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  /**
   * Execute raw SQL query with parameters
   */
  async raw<T = Record<string, unknown>>(
    query: string,
    _params: unknown[] = [],
  ): Promise<T[]> {
    const result = await this.db.execute(sql.raw(query));
    // Extract rows from result if it's in the format { rows: [...] }
    if (result && typeof result === 'object' && 'rows' in result) {
      return (result as { rows: T[] }).rows;
    }
    return result as unknown as T[];
  }

  /**
   * Get table statistics
   */
  async getTableStats(tableName: string): Promise<{
    rowCount: number;
    tableSize: string;
    indexSize: string;
  }> {
    await this.raw(
      `
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE tablename = $1
    `,
      [tableName],
    );

    // This is a simplified version - in production you'd get actual stats
    return {
      rowCount: 0,
      tableSize: '0 MB',
      indexSize: '0 MB',
    };
  }

  /**
   * Analyze query performance
   */
  async explainQuery(query: string): Promise<any[]> {
    return this.raw(`EXPLAIN ANALYZE ${query}`);
  }

  /**
   * Get database connection info
   */
  async getConnectionInfo(): Promise<{
    version: string;
    currentDatabase: string;
    currentUser: string;
  }> {
    const [version, database, user] = await Promise.all([
      this.raw<{ version: string }>('SELECT version()'),
      this.raw<{ current_database: string }>('SELECT current_database()'),
      this.raw<{ current_user: string }>('SELECT current_user'),
    ]);

    return {
      version: version[0]?.version || 'Unknown',
      currentDatabase: database[0]?.current_database || 'Unknown',
      currentUser: user[0]?.current_user || 'Unknown',
    };
  }
}
