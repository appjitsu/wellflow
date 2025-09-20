declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
  }
}

export {};
