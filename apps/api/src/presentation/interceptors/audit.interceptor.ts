import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface RequestWithUser {
  method: string;
  url: string;
  user?: {
    id?: string;
  };
}

/**
 * Audit Interceptor
 * Logs API calls for audit purposes
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, user } = request;
    const now = Date.now();

    this.logger.log(
      `Audit: ${method} ${url} - User: ${user?.id || 'anonymous'} - Started at: ${new Date().toISOString()}`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `Audit: ${method} ${url} - User: ${user?.id || 'anonymous'} - Completed in: ${duration}ms`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        this.logger.log(
          `Audit: ${method} ${url} - User: ${user?.id || 'anonymous'} - Completed in: ${duration}ms`,
        );
        return throwError(() => error);
      }),
    );
  }
}
