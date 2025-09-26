import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  eq,
  and,
  gte,
  lte,
  desc,
  asc,
  sql,
  count,
  or,
  like,
} from 'drizzle-orm';
import * as schema from '../../database/schema';
import {
  AuditLogRepository,
  AuditLogFilters,
  AuditLogPagination,
  AuditLogSearchResult,
} from '../../domain/repositories/audit-log.repository.interface';
import {
  AuditLog,
  AuditAction,
  AuditResourceType,
} from '../../domain/entities/audit-log.entity';
import { auditLogs } from '../../database/schemas/audit-logs';

@Injectable()
export class AuditLogRepositoryImpl implements AuditLogRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async save(auditLog: AuditLog): Promise<void> {
    const data = {
      id: auditLog.getId(),
      userId: auditLog.getUserId(),
      organizationId: auditLog.getOrganizationId(),
      action: auditLog.getAction(),
      resourceType: auditLog.getResourceType(),
      resourceId: auditLog.getResourceId(),
      timestamp: auditLog.getTimestamp(),
      ipAddress: auditLog.getIpAddress(),
      userAgent: auditLog.getUserAgent(),
      oldValues: auditLog.getOldValues()
        ? JSON.stringify(auditLog.getOldValues())
        : null,
      newValues: auditLog.getNewValues()
        ? JSON.stringify(auditLog.getNewValues())
        : null,
      success: auditLog.getSuccess(),
      errorMessage: auditLog.getErrorMessage(),
      metadata: auditLog.getMetadata()
        ? JSON.stringify(auditLog.getMetadata())
        : null,
      requestId: auditLog.getRequestId(),
      endpoint: auditLog.getEndpoint(),
      method: auditLog.getMethod(),
      duration: auditLog.getDuration()?.toString(),
      createdBy: auditLog.getUserId(), // Log who created this audit entry
    };

    await this.db.insert(auditLogs).values(data);
  }

  async saveBatch(auditLogs: AuditLog[]): Promise<void> {
    if (auditLogs.length === 0) return;

    const data = auditLogs.map((log) => ({
      id: log.getId(),
      userId: log.getUserId(),
      organizationId: log.getOrganizationId(),
      action: log.getAction(),
      resourceType: log.getResourceType(),
      resourceId: log.getResourceId(),
      timestamp: log.getTimestamp(),
      ipAddress: log.getIpAddress(),
      userAgent: log.getUserAgent(),
      oldValues: log.getOldValues() ? JSON.stringify(log.getOldValues()) : null,
      newValues: log.getNewValues() ? JSON.stringify(log.getNewValues()) : null,
      success: log.getSuccess(),
      errorMessage: log.getErrorMessage(),
      metadata: log.getMetadata() ? JSON.stringify(log.getMetadata()) : null,
      requestId: log.getRequestId(),
      endpoint: log.getEndpoint(),
      method: log.getMethod(),
      duration: log.getDuration()?.toString(),
      createdBy: log.getUserId(),
    }));

    await this.db.insert(schema.auditLogs).values(data);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const result = await this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);

    if (result.length === 0) return null;

    return this.mapToEntity(result[0]);
  }

  async findByUserId(
    userId: string,
    pagination: AuditLogPagination = {},
  ): Promise<AuditLogSearchResult> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = pagination;

    const conditions = [eq(auditLogs.userId, userId)];

    const orderBy =
      sortOrder === 'desc' ? desc(auditLogs[sortBy]) : asc(auditLogs[sortBy]);

    const offset = (page - 1) * limit;

    const [logs, totalResult] = await Promise.all([
      this.db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(auditLogs)
        .where(and(...conditions)),
    ]);

    const total = totalResult[0].count;

    return {
      logs: logs.map(this.mapToEntity),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findByOrganizationId(
    organizationId: string,
    pagination: AuditLogPagination = {},
  ): Promise<AuditLogSearchResult> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = pagination;

    const conditions = [eq(auditLogs.organizationId, organizationId)];

    const orderBy =
      sortOrder === 'desc' ? desc(auditLogs[sortBy]) : asc(auditLogs[sortBy]);

    const offset = (page - 1) * limit;

    const [logs, totalResult] = await Promise.all([
      this.db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(auditLogs)
        .where(and(...conditions)),
    ]);

    const total = totalResult[0].count;

    return {
      logs: logs.map(this.mapToEntity),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findByResource(
    resourceType: AuditResourceType,
    resourceId: string,
    pagination: AuditLogPagination = {},
  ): Promise<AuditLogSearchResult> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = pagination;

    const conditions = [
      eq(auditLogs.resourceType, resourceType),
      eq(auditLogs.resourceId, resourceId),
    ];

    const orderBy =
      sortOrder === 'desc' ? desc(auditLogs[sortBy]) : asc(auditLogs[sortBy]);

    const offset = (page - 1) * limit;

    const [logs, totalResult] = await Promise.all([
      this.db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(auditLogs)
        .where(and(...conditions)),
    ]);

    const total = totalResult[0].count;

    return {
      logs: logs.map(this.mapToEntity),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async search(
    filters: AuditLogFilters,
    pagination: AuditLogPagination = {},
  ): Promise<AuditLogSearchResult> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = pagination;

    const conditions = [];

    if (filters.userId) conditions.push(eq(auditLogs.userId, filters.userId));
    if (filters.organizationId)
      conditions.push(eq(auditLogs.organizationId, filters.organizationId));
    if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
    if (filters.resourceType)
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    if (filters.resourceId)
      conditions.push(eq(auditLogs.resourceId, filters.resourceId));
    if (filters.success !== undefined)
      conditions.push(eq(auditLogs.success, filters.success));
    if (filters.ipAddress)
      conditions.push(eq(auditLogs.ipAddress, filters.ipAddress));
    if (filters.requestId)
      conditions.push(eq(auditLogs.requestId, filters.requestId));
    if (filters.endpoint)
      conditions.push(like(auditLogs.endpoint, `%${filters.endpoint}%`));

    if (filters.startDate)
      conditions.push(gte(auditLogs.timestamp, filters.startDate));
    if (filters.endDate)
      conditions.push(lte(auditLogs.timestamp, filters.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      sortOrder === 'desc' ? desc(auditLogs[sortBy]) : asc(auditLogs[sortBy]);

    const offset = (page - 1) * limit;

    const [logs, totalResult] = await Promise.all([
      this.db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      this.db.select({ count: count() }).from(auditLogs).where(whereClause),
    ]);

    const total = totalResult[0].count;

    return {
      logs: logs.map(this.mapToEntity),
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async getStatistics(filters?: {
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalLogs: number;
    successfulActions: number;
    failedActions: number;
    actionsByType: Record<AuditAction, number>;
    resourcesByType: Record<AuditResourceType, number>;
    topUsers: Array<{ userId: string; count: number }>;
    recentActivity: AuditLog[];
  }> {
    const conditions = [];

    if (filters?.organizationId)
      conditions.push(eq(auditLogs.organizationId, filters.organizationId));
    if (filters?.startDate)
      conditions.push(gte(auditLogs.timestamp, filters.startDate));
    if (filters?.endDate)
      conditions.push(lte(auditLogs.timestamp, filters.endDate));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get basic statistics
    const [
      statsResult,
      actionsResult,
      resourcesResult,
      usersResult,
      recentResult,
    ] = await Promise.all([
      this.db
        .select({
          total: count(),
          successful: sql<number>`count(case when ${auditLogs.success} = true then 1 end)`,
          failed: sql<number>`count(case when ${auditLogs.success} = false then 1 end)`,
        })
        .from(auditLogs)
        .where(whereClause),

      this.db
        .select({
          action: auditLogs.action,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.action),

      this.db
        .select({
          resourceType: auditLogs.resourceType,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.resourceType),

      this.db
        .select({
          userId: auditLogs.userId,
          count: count(),
        })
        .from(auditLogs)
        .where(whereClause)
        .groupBy(auditLogs.userId)
        .orderBy(desc(count()))
        .limit(10),

      this.db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.timestamp))
        .limit(50),
    ]);

    const stats = statsResult[0];

    // Convert arrays to records
    const actionsByType = actionsResult.reduce(
      (acc, row) => {
        acc[row.action as AuditAction] = row.count;
        return acc;
      },
      {} as Record<AuditAction, number>,
    );

    const resourcesByType = resourcesResult.reduce(
      (acc, row) => {
        acc[row.resourceType as AuditResourceType] = row.count;
        return acc;
      },
      {} as Record<AuditResourceType, number>,
    );

    const topUsers = usersResult.map((row) => ({
      userId: row.userId!,
      count: row.count,
    }));

    return {
      totalLogs: stats.total,
      successfulActions: stats.successful,
      failedActions: stats.failed,
      actionsByType,
      resourcesByType,
      topUsers,
      recentActivity: recentResult.map(this.mapToEntity),
    };
  }

  async archiveLogs(olderThan: Date): Promise<number> {
    // This would typically move logs to a separate archive table/database
    // For now, we'll just return the count that would be archived
    const result = await this.db
      .select({ count: count() })
      .from(auditLogs)
      .where(lte(auditLogs.timestamp, olderThan));

    return result[0].count;
  }

  async deleteLogs(olderThan: Date): Promise<number> {
    const result = await this.db
      .delete(auditLogs)
      .where(lte(auditLogs.timestamp, olderThan));

    return result.rowCount || 0;
  }

  private mapToEntity(row: any): AuditLog {
    return new AuditLog(
      row.id,
      row.userId,
      row.organizationId,
      row.action as AuditAction,
      row.resourceType as AuditResourceType,
      row.resourceId,
      row.timestamp,
      row.ipAddress,
      row.userAgent,
      row.oldValues ? JSON.parse(row.oldValues) : null,
      row.newValues ? JSON.parse(row.newValues) : null,
      row.success,
      row.errorMessage,
      row.metadata ? JSON.parse(row.metadata) : null,
      row.requestId,
      row.endpoint,
      row.method,
      row.duration ? parseInt(row.duration) : null,
    );
  }
}
