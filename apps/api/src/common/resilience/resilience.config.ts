/**
 * Shared configuration constants for resilience patterns
 */
export const RESILIENCE_CONFIG = {
  // Circuit Breaker defaults
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 5,
    RECOVERY_TIMEOUT_MS: 60000, // 1 minute
    HALF_OPEN_MAX_CALLS: 3,
  },

  // Retry defaults
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    BACKOFF_MULTIPLIER: 2,
    MAX_DELAY_MS: 30000, // 30 seconds
  },
} as const;
