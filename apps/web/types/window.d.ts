declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
    __SENTRY_REPLAY_INITIALIZED__?: boolean;
    LogRocket?: {
      init: (appId: string, options?: Record<string, unknown>) => void;
      identify: (userId: string, data?: Record<string, unknown>) => void;
      captureException: (error: Error, extra?: Record<string, unknown>) => void;
      track: (key: string, data?: Record<string, unknown>) => void;
      getSessionURL: (callback: (url: string) => void) => void;
    };
  }
}

export {};
