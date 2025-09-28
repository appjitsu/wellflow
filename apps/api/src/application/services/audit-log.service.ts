import { Injectable, Inject, Logger } from '@nestjs/common';
import { Request } from 'express';
import type { AuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';

/**
 * Extended Request interface with custom properties
 */
interface EnhancedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
  };
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  route: {
    path?: string;
  };
}
import {
  AuditLog,
  AuditAction,
  AuditResourceType,
  AuditMetadata,
} from '../../domain/entities/audit-log.entity';

/**
 * Request context for audit logging
 */
interface AuditRequestContext {
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
  correlationId?: string;
  endpoint?: string;
  method?: string;
}

/**
 * Audit log service - handles all audit logging operations
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private context: AuditRequestContext = {};

  constructor(
    @Inject('AuditLogRepository')
    private readonly auditLogRepository: AuditLogRepository,
  ) {
    // Context will be set per request via setContext method
  }

  /**
   * Set request context for audit logging
   */
  setContext(request: EnhancedRequest): void {
    this.context = {
      userId: request.user?.id,
      organizationId: request.user?.organizationId,
      ipAddress: this.getClientIp(request),
      userAgent: request.headers?.['user-agent'] as string,
      requestId: request.requestId,
      sessionId: request.sessionId,
      correlationId: request.correlationId,
      endpoint: request.route?.path,
      method: request.method,
    };
  }

  /**
   * Initialize request context from HTTP request (deprecated - use setContext)
   */
  private initializeContext(): void {
    // No longer used - context set via setContext method
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: EnhancedRequest): string | undefined {
    // Use headers object directly instead of get() method
    const forwarded = request?.headers?.['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0]?.trim();
    }

    const realIp = request?.headers?.['x-real-ip'] as string;
    if (realIp) {
      return realIp;
    }

    return request?.ip || request?.socket?.remoteAddress;
  }

  /**
   * Set user context manually (for non-HTTP contexts)
   */
  setUserContext(userId: string, organizationId?: string): void {
    this.context.userId = userId;
    this.context.organizationId = organizationId;
  }

  /**
   * Set request context manually
   */
  setRequestContext(
    requestId: string,
    sessionId?: string,
    correlationId?: string,
  ): void {
    this.context.requestId = requestId;
    this.context.sessionId = sessionId;
    this.context.correlationId = correlationId;
  }

  /**
   * Log a successful action
   */
  async logSuccess(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId?: string,
    changes?: {
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    },
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logAction(
      action,
      resourceType,
      resourceId,
      true,
      undefined,
      changes,
      metadata,
    );
  }

  /**
   * Log a failed action
   */
  async logFailure(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId?: string,
    errorMessage?: string,
    changes?: {
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    },
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logAction(
      action,
      resourceType,
      resourceId,
      false,
      errorMessage,
      changes,
      metadata,
    );
  }

  /**
   * Log an action with full details
   */
  async logAction(
    action: AuditAction,
    resourceType: AuditResourceType,
    resourceId?: string,
    success: boolean = true,
    errorMessage?: string,
    changes?: {
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
    },
    metadata?: AuditMetadata,
  ): Promise<void> {
    try {
      const auditLog = AuditLog.create({
        userId: this.context.userId,
        organizationId: this.context.organizationId,
        action,
        resourceType,
        resourceId,
        ipAddress: this.context.ipAddress,
        userAgent: this.context.userAgent,
        oldValues: changes?.oldValues,
        newValues: changes?.newValues,
        success,
        errorMessage,
        metadata: {
          ...metadata,
          sessionId: this.context.sessionId,
          correlationId: this.context.correlationId,
          endpoint: this.context.endpoint,
          method: this.context.method,
        },
        requestId: this.context.requestId,
        endpoint: this.context.endpoint,
        method: this.context.method,
      });

      await this.auditLogRepository.save(auditLog);

      const resourceIdentifier = resourceId ? `(${resourceId})` : '';
      this.logger.debug(
        `Audit log created: ${action} ${resourceType}${resourceIdentifier} by user ${this.context.userId || 'unknown'}`,
      );
    } catch (error) {
      // Don't let audit logging failures break the main flow
      this.logger.error(
        `Failed to create audit log for ${action} ${resourceType}:`,
        error,
      );
    }
  }

  /**
   * Log CREATE action
   */
  async logCreate(
    resourceType: AuditResourceType,
    resourceId: string,
    newValues: Record<string, unknown>,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.CREATE,
      resourceType,
      resourceId,
      { newValues },
      metadata,
    );
  }

  /**
   * Log READ action
   */
  async logRead(
    resourceType: AuditResourceType,
    resourceId?: string,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.READ,
      resourceType,
      resourceId,
      {},
      metadata,
    );
  }

  /**
   * Log UPDATE action
   */
  async logUpdate(
    resourceType: AuditResourceType,
    resourceId: string,
    oldValues: Record<string, unknown>,
    newValues: Record<string, unknown>,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.UPDATE,
      resourceType,
      resourceId,
      { oldValues, newValues },
      metadata,
    );
  }

  /**
   * Log DELETE action
   */
  async logDelete(
    resourceType: AuditResourceType,
    resourceId: string,
    oldValues: Record<string, unknown>,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.DELETE,
      resourceType,
      resourceId,
      { oldValues },
      metadata,
    );
  }

  /**
   * Log EXECUTE action (for commands, jobs, etc.)
   */
  async logExecute(
    resourceType: AuditResourceType,
    resourceId?: string,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.EXECUTE,
      resourceType,
      resourceId,
      {},
      metadata,
    );
  }

  /**
   * Log authentication events
   */
  async logLogin(
    userId: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: AuditMetadata,
  ): Promise<void> {
    const tempContext = { ...this.context, userId };
    this.context = tempContext;

    if (success) {
      await this.logSuccess(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        userId,
        {},
        metadata,
      );
    } else {
      await this.logFailure(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        userId,
        errorMessage,
        {},
        metadata,
      );
    }
  }

  async logLogout(userId: string, metadata?: AuditMetadata): Promise<void> {
    await this.logSuccess(
      AuditAction.LOGOUT,
      AuditResourceType.USER,
      userId,
      {},
      metadata,
    );
  }

  /**
   * Log data export/import operations
   */
  async logExport(
    resourceType: AuditResourceType,
    metadata?: AuditMetadata & { recordCount?: number; fileName?: string },
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.EXPORT,
      resourceType,
      undefined,
      {},
      metadata,
    );
  }

  async logImport(
    resourceType: AuditResourceType,
    recordCount: number,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.IMPORT,
      resourceType,
      undefined,
      {},
      { ...metadata, recordCount },
    );
  }

  /**
   * Log approval/rejection workflows
   */
  async logApprove(
    resourceType: AuditResourceType,
    resourceId: string,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.APPROVE,
      resourceType,
      resourceId,
      {},
      metadata,
    );
  }

  async logReject(
    resourceType: AuditResourceType,
    resourceId: string,
    reason?: string,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.REJECT,
      resourceType,
      resourceId,
      {},
      { ...metadata, rejectionReason: reason },
    );
  }

  /**
   * Log submission actions
   */
  async logSubmit(
    resourceType: AuditResourceType,
    resourceId: string,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logSuccess(
      AuditAction.SUBMIT,
      resourceType,
      resourceId,
      {},
      metadata,
    );
  }

  /**
   * Log system-level operations
   */
  async logSystemAction(
    action: AuditAction,
    operation: string,
    success: boolean = true,
    errorMessage?: string,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logAction(
      action,
      AuditResourceType.SYSTEM,
      operation,
      success,
      errorMessage,
      {},
      metadata,
    );
  }

  /**
   * Log external API calls
   */
  async logApiCall(
    serviceName: string,
    endpoint: string,
    method: string,
    success: boolean = true,
    errorMessage?: string,
    duration?: number,
    metadata?: AuditMetadata,
  ): Promise<void> {
    await this.logAction(
      AuditAction.EXECUTE,
      AuditResourceType.EXTERNAL_SERVICE,
      `${serviceName}:${endpoint}`,
      success,
      errorMessage,
      {},
      {
        ...metadata,
        serviceName,
        endpoint,
        method,
        duration,
      },
    );
  }

  /**
   * Batch log multiple audit entries (for performance)
   */
  async logBatch(
    entries: Array<{
      action: AuditAction;
      resourceType: AuditResourceType;
      resourceId?: string;
      success?: boolean;
      errorMessage?: string;
      changes?: {
        oldValues?: Record<string, unknown>;
        newValues?: Record<string, unknown>;
      };
      metadata?: AuditMetadata;
    }>,
  ): Promise<void> {
    try {
      const auditLogs = entries.map((entry) =>
        AuditLog.create({
          userId: this.context.userId,
          organizationId: this.context.organizationId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          ipAddress: this.context.ipAddress,
          userAgent: this.context.userAgent,
          oldValues: entry.changes?.oldValues,
          newValues: entry.changes?.newValues,
          success: entry.success !== false,
          errorMessage: entry.errorMessage,
          metadata: {
            ...entry.metadata,
            sessionId: this.context.sessionId,
            correlationId: this.context.correlationId,
            endpoint: this.context.endpoint,
            method: this.context.method,
          },
          requestId: this.context.requestId,
          endpoint: this.context.endpoint,
          method: this.context.method,
        }),
      );

      await this.auditLogRepository.saveBatch(auditLogs);

      this.logger.debug(`Batch audit log created: ${entries.length} entries`);
    } catch (error) {
      this.logger.error('Failed to create batch audit logs:', error);
    }
  }

  /**
   * Get current request context (for debugging)
   */
  getContext(): AuditRequestContext {
    return { ...this.context };
  }
}
