import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogOptions } from '../decorators/audit-log.decorator';

/**
 * Audit Log Interceptor
 * Automatically logs actions for compliance and security
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.getAllAndOverride<AuditLogOptions>(
      'auditLog',
      [context.getHandler(), context.getClass()],
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
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
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration: Date.now() - startTime,
            success: true,
            timestamp: new Date(),
          });
        },
        error: (error) => {
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

  private logAuditEvent(auditData: any): void {
    // In production, this would write to a dedicated audit log database
    // For now, we'll use structured logging
    console.log('AUDIT_LOG:', JSON.stringify(auditData, null, 2));

    // TODO: Implement proper audit logging to database
    // - Store in dedicated audit_logs table
    // - Send to external audit service
    // - Ensure immutability and integrity
  }
}
