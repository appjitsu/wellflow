import LogRocket from 'logrocket';
import * as Sentry from '@sentry/nextjs';

/**
 * LogRocket integration for WellFlow
 *
 * Note: logrocket-react@6.0.3 may not be fully compatible with React 19.
 * If React integration fails, LogRocket will still provide:
 * - Session recording
 * - Error tracking
 * - Network monitoring
 * - User identification
 * - Custom event tracking
 *
 * React-specific features that may not work:
 * - Component name tracking in recordings
 * - React-specific error boundaries
 */

let isInitialized = false;

export const initLogRocket = () => {
  if (typeof window === 'undefined' || isInitialized) {
    return;
  }

  const appId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

  if (!appId) {
    // LogRocket App ID not configured - initialization skipped
    return;
  }

  try {
    LogRocket.init(appId, {
      // Configure LogRocket options
      console: {
        shouldAggregateConsoleErrors: true,
      },
      network: {
        requestSanitizer: (request) => {
          // Remove sensitive headers
          if (request.headers) {
            delete request.headers.authorization;
            delete request.headers.cookie;
            delete request.headers['x-api-key'];
          }

          // Remove sensitive body data
          if (request.body && typeof request.body === 'string') {
            try {
              const body = JSON.parse(request.body);
              if (body.password) delete body.password;
              if (body.token) delete body.token;
              request.body = JSON.stringify(body);
            } catch {
              // If body is not JSON, leave it as is
            }
          }

          return request;
        },
        responseSanitizer: (response) => {
          // Remove sensitive response data
          if (response.body && typeof response.body === 'string') {
            try {
              const body = JSON.parse(response.body);
              if (body.token) delete body.token;
              if (body.accessToken) delete body.accessToken;
              if (body.refreshToken) delete body.refreshToken;
              response.body = JSON.stringify(body);
            } catch {
              // If body is not JSON, leave it as is
            }
          }

          return response;
        },
      },
      dom: {
        textSanitizer: true,
        inputSanitizer: true,
      },
    });

    // Skip LogRocket React integration for React 19+ compatibility
    // LogRocket core features (session recording, error tracking, network monitoring) work without React integration

    // LogRocket React integration disabled for React 19+ compatibility
    // LogRocket core features enabled: session recording, error tracking, network monitoring

    // Set up LogRocket-Sentry integration
    LogRocket.getSessionURL((sessionURL) => {
      Sentry.setExtra('sessionURL', sessionURL);
    });

    isInitialized = true;

    // LogRocket initialized with Sentry integration
  } catch {
    // Failed to initialize LogRocket - error handled silently
  }
};

export const identifyUser = (
  userId: string,
  userInfo?: {
    name?: string;
    email?: string;
    [key: string]: unknown;
  }
) => {
  if (!isInitialized) {
    return;
  }

  try {
    const identifyData: Record<string, string | number | boolean> = {};

    if (userInfo?.name) identifyData.name = userInfo.name;
    if (userInfo?.email) identifyData.email = userInfo.email;

    // Add other user info, filtering out undefined values
    if (userInfo) {
      Object.entries(userInfo).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'email' && value !== undefined) {
          // eslint-disable-next-line security/detect-object-injection
          identifyData[key] = value as string | number | boolean;
        }
      });
    }

    LogRocket.identify(userId, identifyData);
  } catch {
    // Failed to identify user in LogRocket - error handled silently
  }
};

export const captureException = (error: Error, extra?: Record<string, unknown>) => {
  if (!isInitialized) {
    return;
  }

  try {
    LogRocket.captureException(error, extra);
  } catch {
    // Failed to capture exception in LogRocket - error handled silently
  }
};

export const addTag = (key: string, value: string) => {
  if (!isInitialized) {
    return;
  }

  try {
    // LogRocket doesn't have addTag method, use getSessionURL with tags instead
    LogRocket.track(key, { value });
  } catch {
    // Failed to add tag in LogRocket - error handled silently
  }
};

export default LogRocket;
