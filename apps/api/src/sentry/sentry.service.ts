import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryService {
  /**
   * Capture an exception with Sentry
   */
  captureException(error: Error, context?: string): void {
    if (context) {
      Sentry.withScope((scope) => {
        scope.setTag('context', context);
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  /**
   * Capture a message with Sentry
   */
  captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: string,
  ): void {
    if (context) {
      Sentry.withScope((scope) => {
        scope.setTag('context', context);
        Sentry.captureMessage(message, level);
      });
    } else {
      Sentry.captureMessage(message, level);
    }
  }

  /**
   * Add user context to Sentry
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    Sentry.setUser(user);
  }

  /**
   * Add extra context to Sentry
   */
  setExtra(key: string, value: any): void {
    Sentry.setExtra(key, value);
  }

  /**
   * Add tags to Sentry
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  /**
   * Start a new span for performance monitoring
   */
  startSpan<T>(name: string, op: string, callback: () => T): T {
    return Sentry.startSpan({ name, op }, callback);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    Sentry.addBreadcrumb(breadcrumb);
  }

  /**
   * Flush Sentry events (useful for serverless)
   */
  async flush(timeout = 2000): Promise<boolean> {
    return Sentry.flush(timeout);
  }
}
