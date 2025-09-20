import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";

let isInitialized = false;

export const initLogRocket = () => {
  if (typeof window === "undefined" || isInitialized) {
    return;
  }

  const appId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

  if (!appId) {
    console.warn("LogRocket App ID not configured");
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
            delete request.headers["x-api-key"];
          }

          // Remove sensitive body data
          if (request.body && typeof request.body === "string") {
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
          if (response.body && typeof response.body === "string") {
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

    // Set up LogRocket React integration
    setupLogRocketReact(LogRocket);

    isInitialized = true;
    console.log("✅ LogRocket initialized");
  } catch (error) {
    console.error("❌ Failed to initialize LogRocket:", error);
  }
};

export const identifyUser = (
  userId: string,
  userInfo?: {
    name?: string;
    email?: string;
    [key: string]: unknown;
  },
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
        if (key !== "name" && key !== "email" && value !== undefined) {
          identifyData[key] = value as string | number | boolean;
        }
      });
    }

    LogRocket.identify(userId, identifyData);
  } catch (error) {
    console.error("Failed to identify user in LogRocket:", error);
  }
};

export const captureException = (
  error: Error,
  extra?: Record<string, unknown>,
) => {
  if (!isInitialized) {
    return;
  }

  try {
    LogRocket.captureException(error, extra);
  } catch (e) {
    console.error("Failed to capture exception in LogRocket:", e);
  }
};

export const addTag = (key: string, value: string) => {
  if (!isInitialized) {
    return;
  }

  try {
    // LogRocket doesn't have addTag method, use getSessionURL with tags instead
    LogRocket.track(key, { value });
  } catch (error) {
    console.error("Failed to add tag in LogRocket:", error);
  }
};

export default LogRocket;
