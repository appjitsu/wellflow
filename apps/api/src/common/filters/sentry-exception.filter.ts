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
      const exceptionResponse = exception.getResponse() as
        | string
        | Record<string, unknown>;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse;
        message = (responseObj.message as string) || message;
        error = (responseObj.error as string) || error;
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
    if (
      status >= HttpStatus.INTERNAL_SERVER_ERROR ||
      status === HttpStatus.UNAUTHORIZED ||
      status === HttpStatus.FORBIDDEN
    ) {
      this.sentryService.setExtra('request', {
        method: request.method,
        url: request.url,
        headers: this.sanitizeHeaders(request.headers),
        body: request.body as unknown,
        query: request.query as unknown,
        params: request.params as unknown,
      });

      this.sentryService.setExtra('response', {
        statusCode: status,
        message,
        error,
      });

      if (exception instanceof Error) {
        this.sentryService
          .captureException(exception, 'HTTP_EXCEPTION')
          .catch(() => {
            // Sentry capture errors are logged internally, no additional handling needed
          });
      } else {
        // captureMessage is synchronous, no need for promise handling
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

  private sanitizeHeaders(
    headers: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized = { ...headers };

    // Remove sensitive headers
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    delete sanitized['x-auth-token'];

    return sanitized;
  }
}
