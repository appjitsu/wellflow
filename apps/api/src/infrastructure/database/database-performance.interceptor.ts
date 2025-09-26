import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { DatabasePerformanceService } from './database-performance.service';

@Injectable()
export class DatabasePerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DatabasePerformanceInterceptor.name);

  constructor(private readonly performanceService: DatabasePerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;

    // Only intercept database-related methods
    if (!this.isDatabaseMethod(className, methodName)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        const executionTime = Date.now() - startTime;

        // Record query performance
        await this.performanceService.recordQueryExecution(
          `${className}.${methodName}`,
          executionTime,
          {
            userId: (request as any)?.user?.id,
            applicationName: className,
            clientAddress: request?.ip,
          },
        );

        // Log slow queries
        if (executionTime > 1000) { // More than 1 second
          this.logger.warn(`Slow database operation detected: ${executionTime}ms`, {
            className,
            methodName,
            executionTime,
            userId: (request as any)?.user?.id,
            endpoint: request?.route?.path,
            timestamp: new Date().toISOString(),
          });
        }
      }),
      catchError(async (error) => {
        const executionTime = Date.now() - startTime;

        // Record failed query performance
        await this.performanceService.recordQueryExecution(
          `${className}.${methodName} (FAILED)`,
          executionTime,
          {
            userId: (request as any)?.user?.id,
            applicationName: className,
            clientAddress: request?.ip,
          },
        );

        throw error;
      }),
    );
  }

  private isDatabaseMethod(className: string, methodName: string): boolean {
    // Check if this is a repository or service that interacts with database
    const databaseClasses = [
      'Repository',
      'Service',
      'WellRepositoryImpl',
      'OrganizationRepository',
      'ProductionRepository',
      'AfeRepository',
      'AuditLogRepositoryImpl',
    ];

    return databaseClasses.some(dbClass =>
      className.includes(dbClass) ||
      className.endsWith(dbClass)
    ) && !methodName.startsWith('get') && !methodName.startsWith('is') && !methodName.startsWith('has');
  }
}
