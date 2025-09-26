import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { AuditLogService } from '../../application/services/audit-log.service';
import { AuditAction, AuditResourceType } from '../../domain/entities/audit-log.entity';

/**
 * Audit interceptor - automatically logs all HTTP requests and responses
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
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

        // Log successful responses
        this.auditLogService.logAction(
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
            sessionId: (request as any).sessionId,
            correlationId: (request as any).correlationId,
            businessContext: {
              controller: className,
              handler: methodName,
              params: request.params,
              query: request.query,
              body: this.sanitizeBody(request.body),
            },
          },
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || error.statusCode || 500;

        // Log failed responses
        this.auditLogService.logAction(
          this.mapHttpMethodToAuditAction(request.method),
          this.mapControllerToResourceType(className),
          this.extractResourceId(request, className, methodName),
          false, // failure
          error.message || 'Request failed',
          {}, // no changes
          {
            endpoint: request.url,
            method: request.method,
            statusCode,
            duration,
            errorType: error.name || 'UnknownError',
            errorCode: error.code,
            userAgent: request.get('User-Agent'),
            sessionId: (request as any).sessionId,
            correlationId: (request as any).correlationId,
            businessContext: {
              controller: className,
              handler: methodName,
              params: request.params,
              query: request.query,
              body: this.sanitizeBody(request.body),
            },
          },
        );

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
    const resourceMap: Record<string, AuditResourceType> = {
      WELLS: AuditResourceType.WELL,
      USERS: AuditResourceType.USER,
      ORGANIZATIONS: AuditResourceType.ORGANIZATION,
      LEASES: AuditResourceType.LEASE,
      PRODUCTION: AuditResourceType.PRODUCTION,
      PARTNERS: AuditResourceType.PARTNER,
      CASHCALLS: AuditResourceType.FINANCIAL,
      FINANCIAL: AuditResourceType.FINANCIAL,
      COMPLIANCE: AuditResourceType.COMPLIANCE,
      DOCUMENTS: AuditResourceType.DOCUMENT,
      DRILLINGPROGRAMS: AuditResourceType.DRILLING_PROGRAM,
      WORKOVERS: AuditResourceType.WORKOVER,
      MAINTENANCESCHEDULES: AuditResourceType.MAINTENANCE,
      AFES: AuditResourceType.AFE,
      DIVISIONORDERS: AuditResourceType.DIVISION_ORDER,
      JOINTOPERATINGAGREEMENTS: AuditResourceType.JOA,
      REVENUE: AuditResourceType.REVENUE_DISTRIBUTION,
      VENDORS: AuditResourceType.VENDOR,
      MONITORING: AuditResourceType.SYSTEM,
    };

    return resourceMap[resourceName] || AuditResourceType.API;
  }

  /**
   * Extract resource ID from request parameters
   */
  private extractResourceId(request: any, className: string, methodName: string): string | undefined {
    // Try to extract ID from route parameters
    const params = request.params;
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
  private getRequestId(request: any): string {
    return (
      request.get('X-Request-ID') ||
      request.get('x-request-id') ||
      (request as any).requestId ||
      'unknown'
    );
  }

  /**
   * Get user ID from request
   */
  private getUserId(request: any): string | undefined {
    return (request as any).user?.id || (request as any).userId;
  }

  /**
   * Sanitize request body for logging (remove sensitive data)
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

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

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Get response size estimate
   */
  private getResponseSize(data: any): number {
    try {
      if (data === null || data === undefined) return 0;
      const jsonString = JSON.stringify(data);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch {
      return 0; // If we can't serialize, return 0
    }
  }
}
