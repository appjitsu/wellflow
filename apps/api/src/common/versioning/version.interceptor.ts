import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { VersionService } from './version.service';

declare module 'express' {
  interface Request {
    apiVersion?: string;
    apiVersionInfo?: {
      isCompatible: boolean;
      warnings: string[];
      suggestedVersion?: string;
    };
  }
}

@Injectable()
export class VersionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(VersionInterceptor.name);

  constructor(private readonly versionService: VersionService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { route?: { path?: string } }>();
    const response = context.switchToHttp().getResponse<Response>();

    // Negotiate API version
    const resolvedVersion = this.versionService.negotiateVersion(
      request.headers.accept as string,
      (request.query as { version?: string }).version,
    );

    // Check compatibility
    const compatibility =
      this.versionService.checkCompatibility(resolvedVersion);

    // Set version information on request
    request.apiVersion = resolvedVersion;
    request.apiVersionInfo = compatibility;

    // Add version headers to response
    response.setHeader('API-Version', resolvedVersion);
    response.setHeader('API-Compatible', compatibility.isCompatible.toString());

    if (compatibility.warnings.length > 0) {
      response.setHeader(
        'API-Warnings',
        JSON.stringify(compatibility.warnings),
      );
    }

    if (compatibility.suggestedVersion) {
      response.setHeader(
        'API-Suggested-Version',
        compatibility.suggestedVersion,
      );
    }

    // Log version usage
    const userAgent = request.get('User-Agent') || '';
    const endpoint =
      (request.route as { path?: string } | undefined)?.path || request.url;
    this.versionService.logVersionUsage(resolvedVersion, endpoint, userAgent);

    // Log warnings if any
    if (compatibility.warnings.length > 0) {
      this.logger.warn(
        `API Version warnings for ${endpoint}:`,
        compatibility.warnings,
      );
    }

    return next.handle().pipe(
      tap(() => {
        // Add version metadata to successful responses
        if (response.statusCode < 400) {
          const responseData = (
            response.locals as { data?: Record<string, unknown> }
          )?.data;
          if (responseData && typeof responseData === 'object') {
            (response.locals as { data?: Record<string, unknown> }).data = {
              ...responseData,
              _metadata: {
                apiVersion: resolvedVersion,
                timestamp: new Date().toISOString(),
              },
            };
          }
        }
      }),
    );
  }

  private extractVersion(request: Request): string {
    // Extract version from various sources
    return (
      (request.headers['api-version'] as string) ||
      (request.headers['accept-version'] as string) ||
      (request.query as { version?: string }).version ||
      'v1'
    );
  }
}
