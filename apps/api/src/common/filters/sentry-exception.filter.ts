import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SentryService } from '../../sentry/sentry.service';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  constructor(private readonly sentryService: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Send to Sentry for non-4xx errors or specific 4xx errors we want to track
    if (status >= 500 || status === 401 || status === 403) {
      this.sentryService.setExtra('request', {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        body: request.body,
        query: request.query,
        params: request.params,
      });

      this.sentryService.setExtra('response', {
        statusCode: status,
        message,
        error,
      });

      if (exception instanceof Error) {
        this.sentryService.captureException(exception, 'HTTP_EXCEPTION');
      } else {
        this.sentryService.captureMessage(
          `HTTP Exception: ${message}`,
          'error',
          'HTTP_EXCEPTION',
        );
      }
    }

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    });
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['x-auth-token'];

    return sanitized;
  }
}
