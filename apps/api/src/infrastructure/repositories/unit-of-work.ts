import { Injectable, Inject } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

/**
 * Base Entity interface for change tracking
 */
export interface Entity {
  getId(): { getValue(): string };
  getVersion(): number;
  incrementVersion(): void;
}

/**
 * Unit of Work Transaction interface
 */
export interface UnitOfWorkTransaction {
  commit(): void;
  rollback(): never;
  getTransaction(): unknown;
}

/**
 * Full Unit of Work interface with change tracking
 */
export interface IUnitOfWork {
  // Repository access
  getRepository<T extends Entity>(entityType: new () => T): unknown;

  // Transaction control
  begin(): void;
  commit(): Promise<void>;
  rollback(): void;
  isActive(): boolean;

  // Change tracking
  registerNew<T extends Entity>(entity: T): void;
  registerDirty<T extends Entity>(entity: T): void;
  registerDeleted<T extends Entity>(entity: T): void;
  registerClean<T extends Entity>(entity: T): void;
}

/**
 * Enhanced Unit of Work with Change Tracking
 * Implements the full Unit of Work pattern with proper change tracking
 */
@Injectable()
export class UnitOfWork implements IUnitOfWork {
  private isTransactionActive = false;

  // Change tracking collections
  private newObjects = new Map<string, Entity>();
  private dirtyObjects = new Map<string, Entity>();
  private deletedObjects = new Map<string, Entity>();
  private cleanObjects = new Set<string>();

  // Repository factory map
  private repositoryFactories = new Map<string, (db: unknown) => unknown>();

  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Register a repository factory for an entity type
   */
  registerRepository<T extends Entity>(
    entityType: new () => T,
    factory: (db: unknown) => unknown,
  ): void {
    this.repositoryFactories.set(entityType.name, factory);
  }

  /**
   * Get repository for entity type
   */
  getRepository<T extends Entity>(entityType: new () => T): unknown {
    const factory = this.repositoryFactories.get(entityType.name);
    if (!factory) {
      throw new Error(
        `No repository factory registered for ${entityType.name}`,
      );
    }

    const dbConnection = this.db;
    return factory(dbConnection);
  }

  /**
   * Begin a new transaction
   */
  begin(): void {
    if (this.isTransactionActive) {
      throw new Error('Transaction already in progress');
    }

    this.isTransactionActive = true;
  }

  /**
   * Commit all changes in order
   */
  async commit(): Promise<void> {
    if (!this.isTransactionActive) {
      throw new Error('No active transaction to commit');
    }

    try {
      // Execute all changes within a database transaction
      await this.db.transaction(async (tx) => {
        // Process changes in order: new, dirty, deleted
        await this.commitNewInTransaction(tx);
        await this.commitDirtyInTransaction(tx);
        await this.commitDeletedInTransaction(tx);
      });

      this.clearChanges();
    } catch (error) {
      this.rollback();
      throw error;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Rollback transaction and clear changes
   */
  rollback(): void {
    if (this.isTransactionActive) {
      // Drizzle rollback happens automatically when error is thrown
    }
    this.clearChanges();
    this.cleanup();
  }

  /**
   * Check if transaction is active
   */
  isActive(): boolean {
    return this.isTransactionActive;
  }

  /**
   * Register new entity for insertion
   */
  registerNew<T extends Entity>(entity: T): void {
    const key = this.getEntityKey(entity);

    // If entity was deleted, undelete it
    if (this.deletedObjects.has(key)) {
      this.deletedObjects.delete(key);
      this.dirtyObjects.set(key, entity);
    } else if (!this.dirtyObjects.has(key) && !this.cleanObjects.has(key)) {
      this.newObjects.set(key, entity);
    }
  }

  /**
   * Register entity as modified
   */
  registerDirty<T extends Entity>(entity: T): void {
    const key = this.getEntityKey(entity);

    if (!this.newObjects.has(key) && !this.deletedObjects.has(key)) {
      this.dirtyObjects.set(key, entity);
    }
  }

  /**
   * Register entity for deletion
   */
  registerDeleted<T extends Entity>(entity: T): void {
    const key = this.getEntityKey(entity);

    if (this.newObjects.has(key)) {
      // Entity was new, just remove it
      this.newObjects.delete(key);
    } else {
      this.deletedObjects.set(key, entity);
      this.dirtyObjects.delete(key);
    }
  }

  /**
   * Register entity as clean (no changes)
   */
  registerClean<T extends Entity>(entity: T): void {
    const key = this.getEntityKey(entity);
    this.cleanObjects.add(key);
  }

  /**
   * Get current transaction (for legacy compatibility)
   */
  getCurrentTransaction(): unknown {
    return this.db;
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use the new Unit of Work interface methods instead
   */
  async beginLegacy<T>(
    operation: (transaction: UnitOfWorkTransaction) => Promise<T>,
  ): Promise<T> {
    this.begin();

    const unitOfWorkTransaction: UnitOfWorkTransaction = {
      commit: () => {
        // Commit will be handled by the new commit() method
      },
      rollback: () => {
        throw new Error('Transaction rolled back');
      },
      getTransaction: (): unknown => {
        return this.db;
      },
    };

    try {
      const result = await operation(unitOfWorkTransaction);
      await this.commit();
      return result;
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Commit new objects within transaction
   */
  private async commitNewInTransaction(tx: unknown): Promise<void> {
    for (const [, entity] of this.newObjects) {
      const repository = this.getRepositoryForEntityInTransaction(entity, tx);
      await (repository as { save: (entity: Entity) => Promise<void> }).save(
        entity,
      );
    }
  }

  /**
   * Commit dirty objects with optimistic concurrency
   */
  private async commitDirtyInTransaction(tx: unknown): Promise<void> {
    for (const [key, entity] of this.dirtyObjects) {
      const repository = this.getRepositoryForEntityInTransaction(entity, tx);

      // Check for concurrent modifications
      const currentVersion = await this.getCurrentVersionInTransaction(
        entity,
        tx,
      );
      if (currentVersion !== entity.getVersion()) {
        throw new Error(
          `Concurrent modification detected for entity ${key}. ` +
            `Expected version ${entity.getVersion()}, found ${currentVersion}`,
        );
      }

      entity.incrementVersion();
      await (repository as { save: (entity: Entity) => Promise<void> }).save(
        entity,
      );
    }
  }

  /**
   * Commit deleted objects within transaction
   */
  private async commitDeletedInTransaction(tx: unknown): Promise<void> {
    for (const [, entity] of this.deletedObjects) {
      const repository = this.getRepositoryForEntityInTransaction(entity, tx);
      await (
        repository as {
          delete: (id: { getValue: () => string }) => Promise<void>;
        }
      ).delete(entity.getId());
    }
  }

  /**
   * Clear all change tracking collections
   */
  private clearChanges(): void {
    this.newObjects.clear();
    this.dirtyObjects.clear();
    this.deletedObjects.clear();
    this.cleanObjects.clear();
  }

  /**
   * Get entity key for tracking
   */
  private getEntityKey(entity: Entity): string {
    return `${entity.constructor.name}:${entity.getId().getValue()}`;
  }

  /**
   * Get repository for entity (simplified version)
   */
  private getRepositoryForEntity(entity: Entity): unknown {
    // This is a simplified implementation
    // In practice, you'd have a registry of repositories
    return this.getRepository(entity.constructor as new () => Entity);
  }

  /**
   * Get repository for entity within transaction
   */
  private getRepositoryForEntityInTransaction(
    entity: Entity,
    tx: unknown,
  ): unknown {
    // This is a simplified implementation
    // In practice, you'd have a registry of repositories that accept transactions
    const factory = this.repositoryFactories.get(entity.constructor.name);
    if (!factory) {
      throw new Error(
        `No repository factory registered for ${entity.constructor.name}`,
      );
    }
    return factory(tx);
  }

  /**
   * Get current version of entity from database
   */
  private async getCurrentVersion(entity: Entity): Promise<number> {
    const repository = this.getRepositoryForEntity(entity);
    const current = await (
      repository as {
        findById: (id: { getValue: () => string }) => Promise<Entity | null>;
      }
    ).findById(entity.getId());
    return current?.getVersion() ?? 0;
  }

  /**
   * Get current version of entity from database within transaction
   */
  private async getCurrentVersionInTransaction(
    entity: Entity,
    tx: unknown,
  ): Promise<number> {
    const repository = this.getRepositoryForEntityInTransaction(entity, tx);
    const current = await (
      repository as {
        findById: (id: { getValue: () => string }) => Promise<Entity | null>;
      }
    ).findById(entity.getId());
    return current?.getVersion() ?? 0;
  }

  /**
   * Cleanup transaction state
   */
  private cleanup(): void {
    this.isTransactionActive = false;
  }
}
