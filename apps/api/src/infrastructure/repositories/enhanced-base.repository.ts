import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { AnyPgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core';
import * as schema from '../../database/schema';
import {
  CursorPaginationService,
  CursorPaginationRequest,
  CursorPaginationResponse,
  CursorConfig,
} from '../pagination/cursor-pagination.service';

/**
 * Enhanced Base Repository with Cursor Pagination
 * Extends the base repository pattern with efficient cursor-based pagination
 * Follows Repository Pattern and Single Responsibility Principle
 */
@Injectable()
export abstract class EnhancedBaseRepository<T extends PgTable<TableConfig>> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
    protected readonly table: T,
    protected readonly paginationService: CursorPaginationService,
  ) {}

  /**
   * Safely access a column by key name
   * This method provides type-safe access to table columns while avoiding object injection warnings
   */
  protected getColumn(key: string): AnyPgColumn {
    // eslint-disable-next-line security/detect-object-injection
    const column = (this.table as Record<string, unknown>)[key];
    if (!column) {
      throw new Error(`Column '${key}' not found in table`);
    }
    return column as AnyPgColumn;
  }

  /**
   * Find records with cursor-based pagination
   * Optimized for large datasets with proper index usage
   */
  async findWithCursorPagination(
    request: CursorPaginationRequest,
    config: CursorConfig<T['$inferSelect']>,
    filters?: Record<string, unknown>,
    customFilters?: SQL[],
  ): Promise<CursorPaginationResponse<T['$inferSelect']>> {
    // Validate pagination request
    const validatedRequest =
      this.paginationService.validatePaginationRequest(request);

    // Build filter conditions
    const filterConditions = this.buildFilterConditions(filters);
    const allFilters = customFilters
      ? [...filterConditions, ...customFilters]
      : filterConditions;

    // Create cursor conditions and ordering
    const { conditions, orderBy, limit } =
      this.paginationService.createCursorConditions(
        this.table,
        validatedRequest,
        config,
        allFilters,
      );

    // Execute query
    const query = this.db
      .select()
      .from(this.table as PgTable)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit);

    const records = await query;

    // Create pagination response
    return this.paginationService.createPaginationResponse(
      records,
      validatedRequest,
      config,
    );
  }

  /**
   * Find records by organization with cursor pagination
   * Optimized for multi-tenant queries using organization index
   */
  async findByOrganizationWithCursor(
    organizationId: string,
    request: CursorPaginationRequest,
    config: CursorConfig<T['$inferSelect']>,
    additionalFilters?: Record<string, unknown>,
  ): Promise<CursorPaginationResponse<T['$inferSelect']>> {
    const organizationFilter = eq(
      this.getColumn('organizationId'),
      organizationId,
    );

    const customFilters = [organizationFilter];

    return this.findWithCursorPagination(
      request,
      config,
      additionalFilters,
      customFilters,
    );
  }

  /**
   * Get total count for pagination (expensive operation - use sparingly)
   */
  async getTotalCount(
    filters?: Record<string, unknown>,
    customFilters?: SQL[],
  ): Promise<number> {
    const filterConditions = this.buildFilterConditions(filters);
    const allFilters = customFilters
      ? [...filterConditions, ...customFilters]
      : filterConditions;

    const result = await this.db
      .select({ count: sql`count(*)` })
      .from(this.table as PgTable)
      .where(and(...allFilters));

    return Number(result[0]?.count || 0);
  }

  /**
   * Create default cursor configuration for timestamp-based pagination
   * Uses created_at as primary field and id as secondary for tie-breaking
   */
  protected abstract createDefaultTimestampCursorConfig(): CursorConfig<
    T['$inferSelect']
  >;

  /**
   * Create cursor configuration for ID-based pagination
   * Uses id as primary field for simple UUID-based pagination
   */
  protected abstract createDefaultIdCursorConfig(): CursorConfig<
    T['$inferSelect']
  >;

  /**
   * Build filter conditions from key-value pairs
   */
  protected buildFilterConditions(filters?: Record<string, unknown>): SQL[] {
    if (!filters) return [];

    return Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => eq(this.getColumn(key), value));
  }

  /**
   * Basic CRUD operations (inherited from base functionality)
   */

  /**
   * Create a new record
   */
  async create(data: Partial<T['$inferInsert']>): Promise<T['$inferSelect']> {
    const result = await this.db
      .insert(this.table)
      .values(data as T['$inferInsert'])
      .returning();

    return result[0] as T['$inferSelect'];
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T['$inferSelect'] | null> {
    const result = await this.db
      .select()
      .from(this.table as PgTable<TableConfig>)
      .where(eq(this.getColumn('id'), id))
      .limit(1);

    return (result[0] as T['$inferSelect']) || null;
  }

  /**
   * Update record by ID
   */
  async update(
    id: string,
    data: Partial<T['$inferInsert']>,
  ): Promise<T['$inferSelect'] | null> {
    const result = await this.db
      .update(this.table)
      .set(data)
      .where(eq(this.getColumn('id'), id))
      .returning();

    return (result as unknown as T['$inferSelect'][])[0] || null;
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.getColumn('id'), id))
      .returning();

    return result.length > 0;
  }

  /**
   * Check if record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: this.getColumn('id') })
      .from(this.table as PgTable<TableConfig>)
      .where(eq(this.getColumn('id'), id))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Batch create records
   */
  async batchCreate(data: T['$inferInsert'][]): Promise<T['$inferSelect'][]> {
    if (data.length === 0) return [];

    return await this.db.insert(this.table).values(data).returning();
  }

  /**
   * Find records by organization ID (multi-tenant support)
   */
  async findByOrganizationId(
    organizationId: string,
    limit?: number,
  ): Promise<T['$inferSelect'][]> {
    let query = this.db
      .select()
      .from(this.table as PgTable<TableConfig>)
      .where(eq(this.getColumn('organizationId'), organizationId));

    if (limit) {
      query = query.limit(limit) as typeof query;
    }

    return query;
  }
}
