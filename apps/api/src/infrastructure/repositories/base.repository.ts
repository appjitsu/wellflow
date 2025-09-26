import { Injectable, Inject, Optional } from '@nestjs/common';
import { eq, and, sql, count, desc, asc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type {
  AnyPgColumn,
  PgTable,
  TableConfig,
  PgSelect,
} from 'drizzle-orm/pg-core';
import * as schema from '../../database/schema';
import type { UnitOfWorkTransaction } from './unit-of-work';
import type { ISpecification } from '../../domain/specifications/specification.interface';
import type { SQL } from 'drizzle-orm';

/**
 * Base table interface with required id column
 */
export interface BaseTable extends PgTable<TableConfig> {
  id: AnyPgColumn;
}

/**
 * SQL Specification interface that extends ISpecification with SQL generation capability
 */
export interface ISqlSpecification<T> extends ISpecification<T> {
  toSqlClause(): SQL<unknown>;
}
import { AuditLogService } from '../../application/services/audit-log.service';
import { AuditResourceType } from '../../domain/entities/audit-log.entity';

/**
 * Base Repository Implementation
 * Provides common CRUD operations for all entities using Drizzle ORM
 */
@Injectable()
export abstract class BaseRepository<
  T extends PgTable<TableConfig> & { id: AnyPgColumn },
> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
    protected readonly table: T,
    @Optional() protected readonly auditLogService?: AuditLogService,
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
   * Get the audit resource type for this repository
   * Should be overridden by subclasses
   */
  protected abstract getResourceType(): AuditResourceType;

  /**
   * Create a new record
   */
  async create(data: Partial<T['$inferInsert']>): Promise<T['$inferSelect']> {
    const result = await this.db
      .insert(this.table)
      .values(data as T['$inferInsert'])
      .returning();

    const createdRecord = result[0] as T['$inferSelect'];

    // Audit logging for creation
    await this.logAuditAction('CREATE', createdRecord, {
      newValues: createdRecord,
    });

    return createdRecord;
  }

  /**
   * Create a new record within a transaction
   */
  async createWithinTransaction(
    data: Partial<T['$inferInsert']>,
    unitOfWork: UnitOfWorkTransaction,
  ): Promise<T['$inferSelect']> {
    const result = await (
      unitOfWork.getTransaction() as NodePgDatabase<typeof schema>
    )
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
      .from(this.table as PgTable<TableConfig> & { id: AnyPgColumn })
      .where(
        eq((this.table as PgTable<TableConfig> & { id: AnyPgColumn }).id, id),
      )
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all records with optional filters
   */
  async findAll(
    filters?: Record<string, unknown>,
  ): Promise<T['$inferSelect'][]> {
    let query = this.db.select().from(this.table as PgTable<TableConfig>);

    if (filters) {
      const conditions = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => eq(this.getColumn(key), value));

      if (conditions.length > 0) {
        const condition = and(...conditions);
        if (condition) {
          query = query.where(condition) as unknown as typeof query;
        }
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
        .map(([key, value]) => eq(this.getColumn(key), value));

      if (conditions.length > 0) {
        whereClause = and(...conditions);
      }
    }

    // Build order by clause
    let orderByClause;
    if (orderBy) {
      const field = this.getColumn(orderBy.field);
      orderByClause = orderBy.direction === 'desc' ? desc(field) : asc(field);
    }

    // Execute queries
    let dataQuery: unknown = this.db
      .select()
      .from(this.table as PgTable<TableConfig>);
    let countQuery: unknown = this.db
      .select({ count: count() })
      .from(this.table as PgTable<TableConfig>);

    if (whereClause) {
      dataQuery = (dataQuery as PgSelect).where(whereClause);
      countQuery = (countQuery as PgSelect).where(whereClause);
    }

    if (orderByClause) {
      dataQuery = (dataQuery as PgSelect).orderBy(orderByClause);
    }

    dataQuery = (dataQuery as PgSelect).offset(offset).limit(limit);

    const [data, totalResult] = await Promise.all([
      dataQuery as Promise<T['$inferSelect'][]>,
      countQuery as Promise<{ count: number }[]>,
    ]);

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
    // Get the old record for audit logging
    const oldRecord = await this.findById(id);

    const result = await this.db
      .update(this.table)
      .set(data)
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .returning();

    const updatedRecord = (result as T['$inferSelect'][])[0] || null;

    // Audit logging for update
    if (updatedRecord && oldRecord) {
      await this.logAuditAction(
        'UPDATE',
        updatedRecord as Record<string, unknown>,
        {
          oldValues: oldRecord as Record<string, unknown>,
          newValues: updatedRecord as Record<string, unknown>,
        },
      );
    }

    return updatedRecord;
  }

  /**
   * Update record by ID within a transaction
   */
  async updateWithinTransaction(
    id: string,
    data: Partial<T['$inferInsert']>,
    unitOfWork: UnitOfWorkTransaction,
  ): Promise<T['$inferSelect'] | null> {
    const result = await (
      unitOfWork.getTransaction() as NodePgDatabase<typeof schema>
    )
      .update(this.table)
      .set(data)
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .returning();

    return (result as T['$inferSelect'][])[0] || null;
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<boolean> {
    // Get the record before deleting for audit logging
    const recordToDelete = await this.findById(id);

    const result = await this.db
      .delete(this.table)
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .returning({
        id: (this.table as Record<string, unknown>).id as AnyPgColumn,
      });

    const wasDeleted = result.length > 0;

    // Audit logging for deletion
    if (wasDeleted && recordToDelete) {
      await this.logAuditAction('DELETE', recordToDelete, {
        oldValues: recordToDelete,
      });
    }

    return wasDeleted;
  }

  /**
   * Delete record by ID within a transaction
   */
  async deleteWithinTransaction(
    id: string,
    unitOfWork: UnitOfWorkTransaction,
  ): Promise<boolean> {
    const result = await (
      unitOfWork.getTransaction() as NodePgDatabase<typeof schema>
    )
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
      .from(this.table as PgTable<TableConfig>)
      .where(eq((this.table as Record<string, unknown>).id as AnyPgColumn, id))
      .limit(1);

    return result.length > 0;
  }

  /**
   * Count records with optional filters
   */
  async count(filters?: Record<string, unknown>): Promise<number> {
    let query: unknown = this.db
      .select({ count: count() })
      .from(this.table as PgTable<TableConfig>);

    if (filters) {
      const conditions = Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => eq(this.getColumn(key), value));

      if (conditions.length > 0) {
        query = (query as PgSelect).where(and(...conditions));
      }
    }

    const result = await (query as Promise<{ count: number }[]>);
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
      .from(this.table as PgTable<TableConfig>)
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

  /**
   * Find records by specification
   */
  async findBySpecification<TEntity>(
    specification: ISqlSpecification<TEntity>,
  ): Promise<T['$inferSelect'][]> {
    const sqlClause = specification.toSqlClause();

    return this.db
      .select()
      .from(this.table as PgTable<TableConfig>)
      .where(sqlClause);
  }

  /**
   * Find records by specification with pagination
   */
  async findBySpecificationWithPagination<TEntity>(
    specification: ISqlSpecification<TEntity>,
    offset: number,
    limit: number,
    orderBy?: { field: string; direction: 'asc' | 'desc' },
  ): Promise<{ data: T['$inferSelect'][]; total: number }> {
    const sqlClause = specification.toSqlClause();

    // Build order by clause
    let orderByClause: ReturnType<typeof desc> | undefined;
    if (orderBy) {
      const field = this.getColumn(orderBy.field);
      orderByClause = orderBy.direction === 'desc' ? desc(field) : asc(field);
    }

    // Execute queries
    let dataQuery = this.db
      .select()
      .from(this.table as PgTable<TableConfig>)
      .where(sqlClause);
    const countQuery = this.db
      .select({ count: count() })
      .from(this.table as PgTable<TableConfig>)
      .where(sqlClause);

    if (orderByClause) {
      dataQuery = dataQuery.orderBy(
        orderByClause,
      ) as unknown as typeof dataQuery;
    }

    dataQuery = dataQuery
      .offset(offset)
      .limit(limit) as unknown as typeof dataQuery;

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);

    return {
      data,
      total: totalResult[0]?.count || 0,
    };
  }

  /**
   * Count records by specification
   */
  async countBySpecification<TEntity>(
    specification: ISqlSpecification<TEntity>,
  ): Promise<number> {
    const sqlClause = specification.toSqlClause();

    const result = await this.db
      .select({ count: count() })
      .from(this.table as PgTable<TableConfig>)
      .where(sqlClause);

    return result[0]?.count || 0;
  }

  /**
   * Check if any records satisfy the specification
   */
  async existsBySpecification<TEntity>(
    specification: ISqlSpecification<TEntity>,
  ): Promise<boolean> {
    const count = await this.countBySpecification(specification);
    return count > 0;
  }

  /**
   * Log audit action for database operations
   */
  protected async logAuditAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    record: Record<string, unknown>,
    changes?: {
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    },
  ): Promise<void> {
    if (!this.auditLogService) {
      return; // Audit logging not available
    }

    try {
      const resourceId =
        (record as { id?: string })?.id ||
        (record as { getId?: () => string })?.getId?.() ||
        'unknown';

      switch (action) {
        case 'CREATE':
          await this.auditLogService.logCreate(
            this.getResourceType(),
            resourceId,
            changes?.newValues || record,
          );
          break;
        case 'UPDATE':
          await this.auditLogService.logUpdate(
            this.getResourceType(),
            resourceId,
            changes?.oldValues || {},
            changes?.newValues || record,
          );
          break;
        case 'DELETE':
          await this.auditLogService.logDelete(
            this.getResourceType(),
            resourceId,
            changes?.oldValues || record,
          );
          break;
      }
    } catch (error) {
      // Don't let audit logging failures break the main operation
      // Just log the error and continue
      console.error('Failed to log audit action:', error);
    }
  }
}
