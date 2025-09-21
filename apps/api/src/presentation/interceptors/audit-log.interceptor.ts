import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogOptions } from '../decorators/audit-log.decorator';

interface RequestWithUser extends Request {
  user?: { id?: string; email?: string };
}

interface ResponseWithStatus extends Response {
  statusCode: number;
}

/**
 * Audit Log Interceptor
 * Automatically logs actions for compliance and security
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.getAllAndOverride<AuditLogOptions>(
      'auditLog',
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<ResponseWithStatus>();
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (_response: unknown) => {
          this.logAuditEvent({
            action: auditOptions.action,
            resource: auditOptions.resource || context.getClass().name,
            description: auditOptions.description,
            userId: user?.id,
            userEmail: user?.email,
            ipAddress: request.ip,
            userAgent: request.get('User-Agent'),
            method: request.method,
            url: request.url,
            statusCode: response.statusCode,
            duration: Date.now() - startTime,
            success: true,
            timestamp: new Date(),
          });
        },
        error: (error: { status?: number; message?: string }) => {
          this.logAuditEvent({
            action: auditOptions.action,
            resource: auditOptions.resource || context.getClass().name,
            description: auditOptions.description,
            userId: user?.id,
            userEmail: user?.email,
            ipAddress: request.ip,
            userAgent: request.get('User-Agent'),
            method: request.method,
            url: request.url,
            statusCode: error.status || 500,
            duration: Date.now() - startTime,
            success: false,
            error: error.message,
            timestamp: new Date(),
          });
        },
      }),
    );
  }

  private logAuditEvent(auditData: Record<string, unknown>): void {
    // Structured audit logging for oil & gas compliance
    // Uses JSON format for easy parsing by log aggregation systems
    console.log('AUDIT_LOG:', JSON.stringify(auditData, null, 2));

    // Future enhancement: Database audit logging
    // Implementation would include:
    // - Dedicated audit_logs table with immutable records
    // - External audit service integration (e.g., Splunk, ELK)
    // - Cryptographic integrity verification
    // - Compliance with API 1164 audit requirements
  }
}
