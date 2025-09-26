import { Injectable, Inject } from '@nestjs/common';
import {
  eq,
  and,
  gte,
  lte,
  desc,
  count,
  sql,
  type InferSelectModel,
} from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { leaseOperatingStatements } from '../../database/schema';
import * as schema from '../../database/schema';
import {
  ILosRepository,
  ExpenseLineItemData,
} from '../../domain/repositories/lease-operating-statement.repository.interface';
import { LeaseOperatingStatement } from '../../domain/entities/lease-operating-statement.entity';
import { StatementMonth } from '../../domain/value-objects/statement-month';
import { LosStatus } from '../../domain/enums/los-status.enum';

/**
 * Lease Operating Statement Repository Implementation
 * Handles LOS data access with advanced querying and reporting
 */
@Injectable()
export class LosRepository implements ILosRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Save a lease operating statement entity
   */
  async save(los: LeaseOperatingStatement): Promise<LeaseOperatingStatement> {
    const persistenceData = los.toPersistence();

    // Check if LOS exists
    const existing = await this.findById(los.getId());

    if (existing) {
      // Update existing
      await this.db
        .update(leaseOperatingStatements)
        .set({
          totalExpenses: persistenceData.totalExpenses,
          operatingExpenses: persistenceData.operatingExpenses,
          capitalExpenses: persistenceData.capitalExpenses,
          status: persistenceData.status,
          notes: persistenceData.notes,
          updatedAt: persistenceData.updatedAt,
          expenseBreakdown: persistenceData.expenseBreakdown,
        })
        .where(eq(leaseOperatingStatements.id, los.getId()));
    } else {
      // Create new
      await this.db.insert(leaseOperatingStatements).values({
        id: persistenceData.id,
        organizationId: persistenceData.organizationId,
        leaseId: persistenceData.leaseId,
        statementMonth: persistenceData.statementMonth,
        totalExpenses: persistenceData.totalExpenses,
        operatingExpenses: persistenceData.operatingExpenses,
        capitalExpenses: persistenceData.capitalExpenses,
        status: persistenceData.status,
        notes: persistenceData.notes,
        createdAt: persistenceData.createdAt,
        updatedAt: persistenceData.updatedAt,
        expenseBreakdown: persistenceData.expenseBreakdown,
      });
    }

    return los;
  }

  /**
   * Find LOS by ID
   */
  async findById(id: string): Promise<LeaseOperatingStatement | null> {
    const result = await this.db
      .select()
      .from(leaseOperatingStatements)
      .where(eq(leaseOperatingStatements.id, id))
      .limit(1);

    if (!result[0]) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  /**
   * Find LOS by organization ID
   */
  async findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: LosStatus;
    },
  ): Promise<LeaseOperatingStatement[]> {
    const whereConditions = [
      eq(leaseOperatingStatements.organizationId, organizationId),
    ];

    if (options?.status) {
      whereConditions.push(eq(leaseOperatingStatements.status, options.status));
    }

    let query = this.db
      .select()
      .from(leaseOperatingStatements)
      .where(and(...whereConditions))
      .orderBy(desc(leaseOperatingStatements.statementMonth));

    if (options?.limit) {
      query = query.limit(options.limit) as typeof query;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as typeof query;
    }

    const results = await query;
    return results.map((result) => this.mapToEntity(result));
  }

  /**
   * Find LOS by lease ID
   */
  async findByLeaseId(
    leaseId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: LosStatus;
    },
  ): Promise<LeaseOperatingStatement[]> {
    const whereConditions = [eq(leaseOperatingStatements.leaseId, leaseId)];

    if (options?.status) {
      whereConditions.push(eq(leaseOperatingStatements.status, options.status));
    }

    const query = this.db
      .select()
      .from(leaseOperatingStatements)
      .where(and(...whereConditions))
      .$dynamic();

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy(desc(leaseOperatingStatements.statementMonth));

    const results = await query;
    return results.map((result) => this.mapToEntity(result));
  }

  /**
   * Find LOS by lease ID and statement month
   */
  async findByLeaseIdAndMonth(
    leaseId: string,
    statementMonth: StatementMonth,
  ): Promise<LeaseOperatingStatement | null> {
    const result = await this.db
      .select()
      .from(leaseOperatingStatements)
      .where(
        and(
          eq(leaseOperatingStatements.leaseId, leaseId),
          eq(
            leaseOperatingStatements.statementMonth,
            statementMonth.toString(),
          ),
        ),
      )
      .limit(1);

    if (!result[0]) {
      return null;
    }

    return this.mapToEntity(result[0]);
  }

  /**
   * Find LOS by status
   */
  async findByStatus(
    organizationId: string,
    status: LosStatus,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<LeaseOperatingStatement[]> {
    const query = this.db
      .select()
      .from(leaseOperatingStatements)
      .where(
        and(
          eq(leaseOperatingStatements.organizationId, organizationId),
          eq(leaseOperatingStatements.status, status),
        ),
      )
      .$dynamic();

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy(desc(leaseOperatingStatements.statementMonth));

    const results = await query;
    return results.map((result) => this.mapToEntity(result));
  }

  /**
   * Find LOS by date range
   */
  async findByDateRange(
    organizationId: string,
    startMonth: StatementMonth,
    endMonth: StatementMonth,
    options?: {
      leaseId?: string;
      status?: LosStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<LeaseOperatingStatement[]> {
    const conditions = [
      eq(leaseOperatingStatements.organizationId, organizationId),
      gte(
        leaseOperatingStatements.statementMonth,
        `${startMonth.toString()}-01`,
      ),
      lte(leaseOperatingStatements.statementMonth, `${endMonth.toString()}-01`),
    ];

    if (options?.leaseId) {
      conditions.push(eq(leaseOperatingStatements.leaseId, options.leaseId));
    }

    if (options?.status) {
      conditions.push(eq(leaseOperatingStatements.status, options.status));
    }

    const query = this.db
      .select()
      .from(leaseOperatingStatements)
      .where(and(...conditions))
      .$dynamic();

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.offset(options.offset);
    }

    query.orderBy(desc(leaseOperatingStatements.statementMonth));

    const results = await query;
    return results.map((result) => this.mapToEntity(result));
  }

  /**
   * Find draft LOS that need attention
   */
  async findDraftStatements(
    organizationId: string,
    olderThanDays?: number,
  ): Promise<LeaseOperatingStatement[]> {
    const conditions = [
      eq(leaseOperatingStatements.organizationId, organizationId),
      eq(leaseOperatingStatements.status, LosStatus.DRAFT),
    ];

    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      conditions.push(lte(leaseOperatingStatements.createdAt, cutoffDate));
    }

    const results = await this.db
      .select()
      .from(leaseOperatingStatements)
      .where(and(...conditions))
      .orderBy(desc(leaseOperatingStatements.createdAt));

    return results.map((result) => this.mapToEntity(result));
  }

  /**
   * Find finalized LOS ready for distribution
   */
  async findReadyForDistribution(
    organizationId: string,
  ): Promise<LeaseOperatingStatement[]> {
    const results = await this.db
      .select()
      .from(leaseOperatingStatements)
      .where(
        and(
          eq(leaseOperatingStatements.organizationId, organizationId),
          eq(leaseOperatingStatements.status, LosStatus.FINALIZED),
        ),
      )
      .orderBy(desc(leaseOperatingStatements.statementMonth));

    return results.map((result) => this.mapToEntity(result));
  }

  /**
   * Check if LOS exists for lease and month
   */
  async existsByLeaseIdAndMonth(
    leaseId: string,
    statementMonth: StatementMonth,
  ): Promise<boolean> {
    const result = await this.db
      .select({ count: count() })
      .from(leaseOperatingStatements)
      .where(
        and(
          eq(leaseOperatingStatements.leaseId, leaseId),
          eq(
            leaseOperatingStatements.statementMonth,
            statementMonth.toString(),
          ),
        ),
      );

    return (result[0]?.count ?? 0) > 0;
  }

  /**
   * Get total expense summary by lease for a date range
   */
  async getExpenseSummaryByLease(
    organizationId: string,
    startMonth: StatementMonth,
    endMonth: StatementMonth,
  ): Promise<
    {
      leaseId: string;
      totalOperatingExpenses: number;
      totalCapitalExpenses: number;
      totalExpenses: number;
      statementCount: number;
    }[]
  > {
    return await this.db
      .select({
        leaseId: leaseOperatingStatements.leaseId,
        totalOperatingExpenses: sql<number>`COALESCE(SUM(CAST(${leaseOperatingStatements.operatingExpenses} AS DECIMAL)), 0)`,
        totalCapitalExpenses: sql<number>`COALESCE(SUM(CAST(${leaseOperatingStatements.capitalExpenses} AS DECIMAL)), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${leaseOperatingStatements.totalExpenses} AS DECIMAL)), 0)`,
        statementCount: count(),
      })
      .from(leaseOperatingStatements)
      .where(
        and(
          eq(leaseOperatingStatements.organizationId, organizationId),
          gte(
            leaseOperatingStatements.statementMonth,
            `${startMonth.toString()}-01`,
          ),
          lte(
            leaseOperatingStatements.statementMonth,
            `${endMonth.toString()}-01`,
          ),
        ),
      )
      .groupBy(leaseOperatingStatements.leaseId);
  }

  /**
   * Get expense trends for organization
   */
  async getExpenseTrends(
    organizationId: string,
    months: number,
  ): Promise<
    {
      month: string;
      totalOperatingExpenses: number;
      totalCapitalExpenses: number;
      totalExpenses: number;
      statementCount: number;
    }[]
  > {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return await this.db
      .select({
        month: sql<string>`TO_CHAR(${leaseOperatingStatements.statementMonth}, 'YYYY-MM')`,
        totalOperatingExpenses: sql<number>`COALESCE(SUM(CAST(${leaseOperatingStatements.operatingExpenses} AS DECIMAL)), 0)`,
        totalCapitalExpenses: sql<number>`COALESCE(SUM(CAST(${leaseOperatingStatements.capitalExpenses} AS DECIMAL)), 0)`,
        totalExpenses: sql<number>`COALESCE(SUM(CAST(${leaseOperatingStatements.totalExpenses} AS DECIMAL)), 0)`,
        statementCount: count(),
      })
      .from(leaseOperatingStatements)
      .where(
        and(
          eq(leaseOperatingStatements.organizationId, organizationId),
          gte(
            leaseOperatingStatements.statementMonth,
            startDate.toISOString().substring(0, 10),
          ),
        ),
      )
      .groupBy(
        sql`TO_CHAR(${leaseOperatingStatements.statementMonth}, 'YYYY-MM')`,
      )
      .orderBy(
        sql`TO_CHAR(${leaseOperatingStatements.statementMonth}, 'YYYY-MM')`,
      );
  }

  /**
   * Delete LOS by ID (only if in draft status)
   */
  async delete(id: string): Promise<void> {
    await this.db
      .delete(leaseOperatingStatements)
      .where(
        and(
          eq(leaseOperatingStatements.id, id),
          eq(leaseOperatingStatements.status, LosStatus.DRAFT),
        ),
      );
  }

  /**
   * Count LOS by status for organization
   */
  async countByStatus(organizationId: string): Promise<{
    draft: number;
    finalized: number;
    distributed: number;
    archived: number;
  }> {
    const results = await this.db
      .select({
        status: leaseOperatingStatements.status,
        count: count(),
      })
      .from(leaseOperatingStatements)
      .where(eq(leaseOperatingStatements.organizationId, organizationId))
      .groupBy(leaseOperatingStatements.status);

    const statusCounts = {
      draft: 0,
      finalized: 0,
      distributed: 0,
      archived: 0,
    };

    results.forEach((result) => {
      if (result.status in statusCounts) {
        statusCounts[result.status as keyof typeof statusCounts] = result.count;
      }
    });

    return statusCounts;
  }

  /**
   * Map database record to domain entity
   */
  private mapToEntity(
    record: InferSelectModel<typeof leaseOperatingStatements>,
  ): LeaseOperatingStatement {
    // Convert Date to YYYY-MM format string
    let statementMonth: string;
    const stmtMonthValue = record.statementMonth as unknown;
    if (stmtMonthValue instanceof Date) {
      statementMonth = `${stmtMonthValue.getFullYear()}-${String(stmtMonthValue.getMonth() + 1).padStart(2, '0')}`;
    } else if (typeof stmtMonthValue === 'string') {
      // If it's already a string, assume it's in YYYY-MM-DD format and extract YYYY-MM
      statementMonth = stmtMonthValue.substring(0, 7);
    } else {
      throw new Error('Invalid statementMonth format');
    }

    return LeaseOperatingStatement.fromPersistence({
      id: record.id,
      organizationId: record.organizationId,
      leaseId: record.leaseId,
      statementMonth,
      totalExpenses: record.totalExpenses
        ? String(record.totalExpenses)
        : undefined,
      operatingExpenses: record.operatingExpenses
        ? String(record.operatingExpenses)
        : undefined,
      capitalExpenses: record.capitalExpenses
        ? String(record.capitalExpenses)
        : undefined,
      status: record.status as LosStatus,
      notes: record.notes || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      version: 1, // Default version for now
      expenseBreakdown: record.expenseBreakdown as
        | ExpenseLineItemData[]
        | undefined,
    });
  }
}
