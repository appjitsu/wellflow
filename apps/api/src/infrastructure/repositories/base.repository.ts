import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, count, desc, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { AnyPgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core';
import * as schema from '../../database/schema';

/**
 * Base Repository Implementation
 * Provides common CRUD operations for all entities using Drizzle ORM
 */
@Injectable()
export abstract class BaseRepository<T extends PgTable<TableConfig>> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
    protected readonly table: T,
  ) {}

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
      .from(this.table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all records with optional filters
   */
  async findAll(
    filters?: Record<string, unknown>,
  ): Promise<T['$inferSelect'][]> {
    let query = this.db.select().from(this.table as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (filters) {
      const conditions = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) =>
          eq(
            (this.table as Record<string, unknown>)[key] as AnyPgColumn, // eslint-disable-line security/detect-object-injection
            value,
          ),
        );

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      }
    }

    return query;
  }

  /**
   * Find records with pagination
   */
  async findWithPagination(
    offset: number,
    limit: number,
    filters?: Record<string, unknown>,
    orderBy?: { field: string; direction: 'asc' | 'desc' },
  ): Promise<{ data: T['$inferSelect'][]; total: number }> {
    // Build where conditions
    let whereClause;
    if (filters) {
      const conditions = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) =>
          eq(
            (this.table as Record<string, unknown>)[key] as AnyPgColumn, // eslint-disable-line security/detect-object-injection
            value,
          ),
        );

      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }
    }

    // Build order by clause
    let orderByClause;
    if (orderBy) {
      const field = (this.table as Record<string, unknown>)[orderBy.field];
      orderByClause =
        orderBy.direction === 'desc'
          ? desc(field as AnyPgColumn)
          : asc(field as AnyPgColumn);
    }

    // Execute queries
    let dataQuery = this.db.select().from(this.table as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    let countQuery = this.db.select({ count: count() }).from(this.table as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (whereClause) {
      dataQuery = dataQuery.where(whereClause) as any; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      countQuery = countQuery.where(whereClause) as any; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    }

    if (orderByClause) {
      dataQuery = dataQuery.orderBy(orderByClause) as any; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    }

    dataQuery = dataQuery.offset(offset).limit(limit) as any; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);

    return {
      data,
      total: totalResult[0]?.count || 0,
    };
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
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .returning();

    return (result as any)[0] || null; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .returning({
        id: (this.table as Record<string, unknown>).id as AnyPgColumn,
      });

    return result.length > 0;
  }

  /**
   * Check if record exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.db
      .select({ id: (this.table as Record<string, unknown>).id as AnyPgColumn })
      .from(this.table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Count records with optional filters
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    let query = this.db.select({ count: count() }).from(this.table as any); // eslint-disable-line @typescript-eslint/no-explicit-any

    if (filters) {
      const conditions = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) =>
          eq(
            (this.table as Record<string, unknown>)[key] as AnyPgColumn, // eslint-disable-line security/detect-object-injection
            value,
          ),
        );

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any; // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      }
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  /**
   * Find records by organization ID (multi-tenant support)
   */
  async findByOrganizationId(
    organizationId: string,
  ): Promise<T['$inferSelect'][]> {
    return this.db
      .select()
      .from(this.table as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .where(
        eq(
          (this.table as Record<string, unknown>).organizationId as AnyPgColumn,
          organizationId,
        ),
      );
  }

  /**
   * Batch insert records
   */
  async batchCreate(data: T['$inferInsert'][]): Promise<T['$inferSelect'][]> {
    if (data.length === 0) return [];

    return await this.db.insert(this.table).values(data).returning();
  }

  /**
   * Execute raw SQL query
   */
  async executeRaw<R = unknown>(query: string): Promise<R[]> {
    const result = await this.db.execute(sql.raw(query));
    return result.rows as R[];
  }
}
