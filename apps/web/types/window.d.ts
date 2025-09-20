declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
    __SENTRY_REPLAY_INITIALIZED__?: boolean;
    LogRocket?: any;
  }
}

export {};
