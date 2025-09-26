import { Injectable, Inject, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { AuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
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
}

/**
 * Audit log service - handles all audit logging operations
 */
@Injectable({ scope: Scope.REQUEST })
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  private context: AuditRequestContext = {};

  constructor(
    @Inject('AuditLogRepository')
    private readonly auditLogRepository: AuditLogRepository,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.initializeContext();
  }

  /**
   * Initialize request context from HTTP request
   */
  private initializeContext(): void {
    if (this.request) {
      this.context = {
        userId: (this.request as any).user?.id,
        organizationId: (this.request as any).user?.organizationId,
        ipAddress: this.getClientIp(),
        userAgent: this.request.get('User-Agent'),
        requestId: (this.request as any).requestId,
        sessionId: (this.request as any).sessionId,
        correlationId: (this.request as any).correlationId,
      };
    }
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(): string | undefined {
    const forwarded = this.request?.get('X-Forwarded-For');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = this.request?.get('X-Real-IP');
    if (realIp) {
      return realIp;
    }

    return this.request?.ip || this.request?.socket?.remoteAddress;
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
          endpoint: this.request?.route?.path,
          method: this.request?.method,
        },
        requestId: this.context.requestId,
        endpoint: this.request?.route?.path,
        method: this.request?.method,
      });

      await this.auditLogRepository.save(auditLog);

      this.logger.debug(
        `Audit log created: ${action} ${resourceType}${resourceId ? `(${resourceId})` : ''} by user ${this.context.userId || 'unknown'}`,
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
      success ? AuditAction.EXECUTE : AuditAction.EXECUTE, // Could use a different action for API calls
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
            endpoint: this.request?.route?.path,
            method: this.request?.method,
          },
          requestId: this.context.requestId,
          endpoint: this.request?.route?.path,
          method: this.request?.method,
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
