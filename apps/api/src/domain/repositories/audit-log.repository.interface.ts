import { AuditLog, AuditAction, AuditResourceType } from '../entities/audit-log.entity';

/**
 * Audit log query filters
 */
export interface AuditLogFilters {
  userId?: string;
  organizationId?: string;
  action?: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  requestId?: string;
  endpoint?: string;
}

/**
 * Audit log pagination options
 */
export interface AuditLogPagination {
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'action' | 'resourceType';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit log search result
 */
export interface AuditLogSearchResult {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Audit log repository interface
 */
export interface AuditLogRepository {
  /**
   * Save an audit log entry
   */
  save(auditLog: AuditLog): Promise<void>;

  /**
   * Save multiple audit log entries
   */
  saveBatch(auditLogs: AuditLog[]): Promise<void>;

  /**
   * Find audit log by ID
   */
  findById(id: string): Promise<AuditLog | null>;

  /**
   * Find audit logs by user
   */
  findByUserId(userId: string, pagination?: AuditLogPagination): Promise<AuditLogSearchResult>;

  /**
   * Find audit logs by organization
   */
  findByOrganizationId(organizationId: string, pagination?: AuditLogPagination): Promise<AuditLogSearchResult>;

  /**
   * Find audit logs by resource
   */
  findByResource(resourceType: AuditResourceType, resourceId: string, pagination?: AuditLogPagination): Promise<AuditLogSearchResult>;

  /**
   * Search audit logs with filters
   */
  search(filters: AuditLogFilters, pagination?: AuditLogPagination): Promise<AuditLogSearchResult>;

  /**
   * Get audit statistics
   */
  getStatistics(filters?: {
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
  }>;

  /**
   * Archive old audit logs (move to separate storage)
   */
  archiveLogs(olderThan: Date): Promise<number>;

  /**
   * Delete audit logs (for cleanup/retention policies)
   */
  deleteLogs(olderThan: Date): Promise<number>;
}
