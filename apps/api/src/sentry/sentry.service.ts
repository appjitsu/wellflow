import { Injectable, Inject, Optional } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { LogRocketService } from '../logrocket/logrocket.service';

@Injectable()
export class SentryService {
  constructor(
    @Optional()
    @Inject(LogRocketService)
    private readonly logRocketService?: LogRocketService,
  ) {}
  /**
   * Capture an exception with Sentry and LogRocket integration
   */
  async captureException(error: Error, context?: string): Promise<void> {
    // Get LogRocket session URL if available
    let logRocketSessionURL: string | null = null;
    if (this.logRocketService?.isReady()) {
      try {
        logRocketSessionURL = await this.logRocketService.getSessionURL();
        // Also capture in LogRocket
        this.logRocketService.captureException(error, { context });
      } catch (logRocketError) {
        console.warn('Failed to get LogRocket session URL:', logRocketError);
      }
    }

    // Capture in Sentry with LogRocket session URL
    if (context || logRocketSessionURL) {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setTag('context', context);
        }
        if (logRocketSessionURL) {
          scope.setExtra('logRocketSessionURL', logRocketSessionURL);
          scope.setTag('hasLogRocketSession', 'true');
        }
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }

  /**
   * Capture a message with Sentry and LogRocket integration
   */
  async captureMessage(
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: string,
  ): Promise<void> {
    // Log to LogRocket if available
    if (this.logRocketService?.isReady()) {
      try {
        this.logRocketService.log(message, level as any, { context });
      } catch (logRocketError) {
        console.warn('Failed to log to LogRocket:', logRocketError);
      }
    }

    // Capture in Sentry
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
   * Add user context to Sentry and LogRocket
   */
  setUser(user: { id: string; email?: string; username?: string }): void {
    // Set user in Sentry
    Sentry.setUser(user);

    // Identify user in LogRocket if available
    if (this.logRocketService?.isReady()) {
      try {
        this.logRocketService.identify(user.id, {
          email: user.email,
          username: user.username,
        });
      } catch (logRocketError) {
        console.warn('Failed to identify user in LogRocket:', logRocketError);
      }
    }
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
