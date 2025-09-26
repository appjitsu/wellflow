/**
 * Bulkhead execution result
 */
export interface BulkheadResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  executionTime: number;
  bulkheadName: string;
  rejected: boolean;
}

/**
 * Bulkhead configuration
 */
export interface BulkheadConfig {
  name: string;
  maxConcurrentCalls: number;
  maxQueueSize: number;
  queueTimeoutMs: number;
  executionTimeoutMs: number;
  monitoringEnabled: boolean;
}

/**
 * Bulkhead statistics
 */
export interface BulkheadStats {
  name: string;
  activeCalls: number;
  queuedCalls: number;
  completedCalls: number;
  failedCalls: number;
  rejectedCalls: number;
  averageExecutionTime: number;
  lastExecutionTime: Date;
}

/**
 * Bulkhead interface for fault isolation
 */
export interface IBulkhead {
  /**
   * Execute a function within the bulkhead
   */
  execute<T>(fn: () => Promise<T>): Promise<BulkheadResult<T>>;

  /**
   * Execute a function within the bulkhead with timeout
   */
  executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
  ): Promise<BulkheadResult<T>>;

  /**
   * Get current bulkhead statistics
   */
  getStats(): BulkheadStats;

  /**
   * Check if bulkhead can accept new calls
   */
  canAcceptCall(): boolean;

  /**
   * Get bulkhead configuration
   */
  getConfig(): BulkheadConfig;
}

/**
 * Bulkhead registry for managing multiple bulkheads
 */
export interface IBulkheadRegistry {
  /**
   * Create or get a bulkhead by name
   */
  getBulkhead(name: string, config?: Partial<BulkheadConfig>): IBulkhead;

  /**
   * Remove a bulkhead
   */
  removeBulkhead(name: string): boolean;

  /**
   * Get all bulkhead statistics
   */
  getAllStats(): BulkheadStats[];

  /**
   * Get bulkhead by name
   */
  getBulkheadByName(name: string): IBulkhead | undefined;
}
