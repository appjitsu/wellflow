import { TenantContext } from '../../domain/value-objects/tenant-context.vo';

/**
 * Strategy interface for different tenant isolation implementations
 * Follows Strategy Pattern and Dependency Inversion Principle
 */
export interface ITenantIsolationStrategy {
  /**
   * Set the tenant context for the current operation
   */
  setTenantContext(context: TenantContext): Promise<void>;

  /**
   * Clear the tenant context
   */
  clearTenantContext(): Promise<void>;

  /**
   * Get the current tenant context
   */
  getCurrentTenantContext(): Promise<TenantContext | null>;

  /**
   * Execute an operation within a specific tenant context
   */
  executeInTenantContext<T>(
    context: TenantContext,
    operation: () => Promise<T>,
  ): Promise<T>;

  /**
   * Validate that the current context matches the expected tenant
   */
  validateTenantContext(expectedContext: TenantContext): Promise<boolean>;

  /**
   * Get the strategy name for logging and debugging
   */
  getStrategyName(): string;
}

/**
 * Interface for database connection management
 * Follows Interface Segregation Principle
 */
export interface IDatabaseConnectionManager {
  /**
   * Get a database connection
   */
  getConnection(): unknown;

  /**
   * Test the database connection
   */
  testConnection(): Promise<boolean>;

  /**
   * Close the database connection
   */
  closeConnection(): Promise<void>;
}

/**
 * Interface for tenant context management
 * Follows Single Responsibility Principle
 */
export interface ITenantContextManager {
  /**
   * Set the tenant context for the current request/operation
   */
  setContext(context: TenantContext): void;

  /**
   * Get the current tenant context
   */
  getContext(): TenantContext | null;

  /**
   * Clear the tenant context
   */
  clearContext(): void;

  /**
   * Execute an operation within a specific tenant context
   */
  executeInContext<T>(
    context: TenantContext,
    operation: () => Promise<T> | T,
  ): Promise<T>;

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string;

  /**
   * Validate organization access
   */
  validateOrganizationAccess(organizationId: string): void;
}

/**
 * Interface for tenant-aware repository operations
 * Follows Repository Pattern with tenant isolation
 */
export interface ITenantAwareRepository<T> {
  /**
   * Find entity by ID within current tenant context
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find entities by criteria within current tenant context
   */
  findBy(criteria: Partial<T>): Promise<T[]>;

  /**
   * Save entity with automatic tenant context
   */
  save(entity: T): Promise<T>;

  /**
   * Update entity within current tenant context
   */
  update(id: string, updates: Partial<T>): Promise<T>;

  /**
   * Delete entity within current tenant context
   */
  delete(id: string): Promise<boolean>;

  /**
   * Count entities within current tenant context
   */
  count(criteria?: Partial<T>): Promise<number>;

  /**
   * Check if entity exists within current tenant context
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Interface for tenant-aware database operations
 * Follows Decorator Pattern for adding tenant awareness
 */
export interface ITenantAwareDatabase {
  /**
   * Execute a query with automatic tenant filtering
   */
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Execute a query within a specific tenant context
   */
  queryInTenantContext<T>(
    context: TenantContext,
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;

  /**
   * Begin a transaction with tenant context
   */
  beginTransaction(): Promise<ITenantAwareTransaction>;

  /**
   * Get the underlying database connection
   */
  getConnection(): unknown;
}

/**
 * Interface for tenant-aware database transactions
 */
export interface ITenantAwareTransaction {
  /**
   * Execute a query within the transaction and tenant context
   */
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Commit the transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the transaction
   */
  rollback(): Promise<void>;

  /**
   * Get the tenant context for this transaction
   */
  getTenantContext(): TenantContext | null;
}
