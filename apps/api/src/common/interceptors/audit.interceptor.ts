import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { Request, Response } from 'express';
import { AuditLogService } from '../../application/services/audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../../domain/entities/audit-log.entity';

interface ExtendedRequest extends Request {
  sessionId?: string;
  correlationId?: string;
  user?: { userId?: string };
  userId?: string;
  requestId?: string;
}

/**
 * Audit interceptor - automatically logs all HTTP requests and responses
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<ExtendedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    const startTime = Date.now();
    const requestId = this.getRequestId(request);
    const userId = this.getUserId(request);

    // Log the incoming request
    this.logger.debug(
      `Request: ${request.method} ${request.url} by user ${userId || 'anonymous'} (${requestId})`,
    );

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful responses asynchronously
        this.auditLogService
          .logAction(
            this.mapHttpMethodToAuditAction(request.method),
            this.mapControllerToResourceType(className),
            this.extractResourceId(request, className, methodName),
            true, // success
            undefined, // no error
            {}, // no changes
            {
              endpoint: request.url,
              method: request.method,
              statusCode,
              duration,
              responseSize: this.getResponseSize(data),
              userAgent: request.get('User-Agent'),
              sessionId: request.sessionId,
              correlationId: request.correlationId,
              businessContext: {
                controller: className,
                handler: methodName,
                params: request.params,
                query: request.query,
                body: this.sanitizeBody(request.body),
              },
            },
          )
          .catch((err) => this.logger.error('Audit log failed', err));
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const err = error as {
          status?: number;
          statusCode?: number;
          message?: string;
          name?: string;
          code?: string;
        };
        const statusCode = err.status || err.statusCode || 500;

        // Log failed responses asynchronously
        this.auditLogService
          .logAction(
            this.mapHttpMethodToAuditAction(request.method),
            this.mapControllerToResourceType(className),
            this.extractResourceId(request, className, methodName),
            false, // failure
            err.message || 'Request failed',
            {}, // no changes
            {
              endpoint: request.url,
              method: request.method,
              statusCode,
              duration,
              errorType: err.name || 'UnknownError',
              errorCode: err.code,
              userAgent: request.get('User-Agent'),
              sessionId: request.sessionId,
              correlationId: request.correlationId,
              businessContext: {
                controller: className,
                handler: methodName,
                params: request.params,
                query: request.query,
                body: this.sanitizeBody(request.body),
              },
            },
          )
          .catch((logErr) => this.logger.error('Audit log failed', logErr));

        throw error;
      }),
    );
  }

  /**
   * Map HTTP method to audit action
   */
  private mapHttpMethodToAuditAction(method: string): AuditAction {
    switch (method.toUpperCase()) {
      case 'GET':
        return AuditAction.READ;
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.EXECUTE;
    }
  }

  /**
   * Map controller class name to audit resource type
   */
  private mapControllerToResourceType(className: string): AuditResourceType {
    // Remove 'Controller' suffix and convert to resource type
    const resourceName = className.replace(/Controller$/, '').toUpperCase();

    // Map common controllers to resource types
    switch (resourceName) {
      case 'WELLS':
        return AuditResourceType.WELL;
      case 'USERS':
        return AuditResourceType.USER;
      case 'ORGANIZATIONS':
        return AuditResourceType.ORGANIZATION;
      case 'LEASES':
        return AuditResourceType.LEASE;
      case 'PRODUCTION':
        return AuditResourceType.PRODUCTION;
      case 'PARTNERS':
        return AuditResourceType.PARTNER;
      case 'CASHCALLS':
      case 'FINANCIAL':
        return AuditResourceType.FINANCIAL;
      case 'COMPLIANCE':
        return AuditResourceType.COMPLIANCE;
      case 'DOCUMENTS':
        return AuditResourceType.DOCUMENT;
      case 'DRILLINGPROGRAMS':
        return AuditResourceType.DRILLING_PROGRAM;
      case 'WORKOVERS':
        return AuditResourceType.WORKOVER;
      case 'MAINTENANCESCHEDULES':
        return AuditResourceType.MAINTENANCE;
      case 'AFES':
        return AuditResourceType.AFE;
      case 'DIVISIONORDERS':
        return AuditResourceType.DIVISION_ORDER;
      case 'JOINTOPERATINGAGREEMENTS':
        return AuditResourceType.JOA;
      case 'REVENUE':
        return AuditResourceType.REVENUE_DISTRIBUTION;
      case 'VENDORS':
        return AuditResourceType.VENDOR;
      case 'MONITORING':
        return AuditResourceType.SYSTEM;
      default:
        return AuditResourceType.API;
    }
  }

  /**
   * Extract resource ID from request parameters
   */
  private extractResourceId(
    request: Request,
    _className: string,
    _methodName: string,
  ): string | undefined {
    // Try to extract ID from route parameters
    const params = request.params as Record<string, string | undefined>;
    if (params.id) return params.id;
    if (params.wellId) return params.wellId;
    if (params.userId) return params.userId;
    if (params.organizationId) return params.organizationId;
    if (params.leaseId) return params.leaseId;

    // For some operations, we might not have a specific resource ID
    // Return undefined to indicate a collection-level operation
    return undefined;
  }

  /**
   * Get request ID for correlation
   */
  private getRequestId(request: ExtendedRequest): string {
    return (
      (request.headers['x-request-id'] as string) ||
      (request.headers['X-Request-ID'] as string) ||
      request.requestId ||
      'unknown'
    );
  }

  /**
   * Get user ID from request
   */
  private getUserId(request: ExtendedRequest): string | undefined {
    return request.user?.userId || request.userId;
  }

  /**
   * Sanitize request body for logging (remove sensitive data)
   */
  private sanitizeBody(body: unknown): Record<string, unknown> {
    if (!this.isRecord(body)) return {};

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'privateKey',
      'accessToken',
      'refreshToken',
      'apiKey',
      'authorization',
      'creditCard',
      'ssn',
      'socialSecurityNumber',
    ];

    const sanitized = { ...body };

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.includes(key)) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = '[REDACTED]';
      }

      // eslint-disable-next-line security/detect-object-injection
      const value = sanitized[key];
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = this.sanitizeBody(value);
      }
    });

    return sanitized;
  }

  /**
   * Get response size estimate
   */
  private getResponseSize(data: unknown): number {
    try {
      if (data === null || data === undefined) return 0;
      const jsonString = JSON.stringify(data);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch {
      return 0; // If we can't serialize, return 0
    }
  }
}
