import { Injectable } from '@nestjs/common';
import * as LogRocket from 'logrocket';
import { AppConfigService } from '../config/app.config';

const LOGROCKET_NOT_INITIALIZED_MESSAGE = 'LogRocket: Service not initialized';

@Injectable()
export class LogRocketService {
  private isInitialized = false;

  constructor(private readonly configService: AppConfigService) {
    this.initialize();
  }

  /**
   * Initialize LogRocket with configuration
   */
  private initialize(): void {
    const appId = this.configService.logRocketAppId;

    if (!appId) {
      console.warn(
        'LogRocket: LOGROCKET_APP_ID not found in environment variables',
      );
      return;
    }

    try {
      LogRocket.init(appId, {
        // Server-side configuration
        network: {
          requestSanitizer: (request) => {
            // Sanitize sensitive data from requests
            if (request.headers?.authorization) {
              request.headers.authorization = '[REDACTED]';
            }
            if (request.headers?.cookie) {
              request.headers.cookie = '[REDACTED]';
            }
            return request;
          },
          responseSanitizer: (response) => {
            // Sanitize sensitive data from responses
            return response;
          },
        },
        console: {
          shouldAggregateConsoleErrors: true,
        },
      });

      this.isInitialized = true;
      console.log('✅ LogRocket initialized successfully');
    } catch (error) {
      console.error('❌ LogRocket initialization failed:', error);
    }
  }

  /**
   * Identify a user session
   */
  identify(userId: string, userInfo?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.warn(LOGROCKET_NOT_INITIALIZED_MESSAGE);
      return;
    }

    try {
      LogRocket.identify(userId, {
        ...userInfo,
        // Add server-side context
        server: true,
        environment: this.configService.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('LogRocket identify error:', error);
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.warn(LOGROCKET_NOT_INITIALIZED_MESSAGE);
      return;
    }

    try {
      LogRocket.track(eventName, {
        ...properties,
        // Add server-side context
        server: true,
        environment: this.configService.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('LogRocket track error:', error);
    }
  }

  /**
   * Add custom log entry
   */
  log(
    message: string,
    level: 'info' | 'warn' | 'error' = 'info',
    extra?: Record<string, unknown>,
  ): void {
    if (!this.isInitialized) {
      console.warn(LOGROCKET_NOT_INITIALIZED_MESSAGE);
      return;
    }

    try {
      LogRocket.log(message, {
        level,
        ...extra,
        // Add server-side context
        server: true,
        environment: this.configService.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('LogRocket log error:', error);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, _extra?: Record<string, unknown>): void {
    if (!this.isInitialized) {
      console.warn(LOGROCKET_NOT_INITIALIZED_MESSAGE);
      return;
    }

    try {
      // LogRocket captureException with minimal options due to type constraints
      LogRocket.captureException(error);
    } catch (logRocketError) {
      console.error('LogRocket captureException error:', logRocketError);
    }
  }

  /**
   * Get session URL for integration with other services (like Sentry)
   */
  getSessionURL(): Promise<string | null> {
    if (!this.isInitialized) {
      console.warn(LOGROCKET_NOT_INITIALIZED_MESSAGE);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        LogRocket.getSessionURL((sessionURL) => {
          resolve(sessionURL);
        });
      } catch (error) {
        console.error('LogRocket getSessionURL error:', error);
        resolve(null);
      }
    });
  }

  /**
   * Add tags for filtering sessions (using track as alternative)
   */
  addTag(key: string, value: string): void {
    if (!this.isInitialized) {
      console.warn(LOGROCKET_NOT_INITIALIZED_MESSAGE);
      return;
    }

    try {
      // Use track as alternative since addTag might not be available in Node.js version
      LogRocket.track('Tag Added', {
        tagKey: key,
        tagValue: value,
        server: true,
        environment: this.configService.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('LogRocket addTag error:', error);
    }
  }

  /**
   * Check if LogRocket is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
