import { PasswordHistory } from '../entities/password-history.entity';

/**
 * Password History Repository Interface
 * Defines the contract for password history data access operations
 * Following Repository pattern and DDD principles
 */
export interface PasswordHistoryRepository {
  /**
   * Save a password history entry
   */
  save(passwordHistory: PasswordHistory): Promise<PasswordHistory>;

  /**
   * Find password history entries for a user (ordered by most recent first)
   * Limited to the specified number of entries (default: 5)
   */
  findByUserId(userId: string, limit?: number): Promise<PasswordHistory[]>;

  /**
   * Get password hashes for a user (for password validation)
   * Returns only the password hashes, not full entities
   */
  getPasswordHashesByUserId(userId: string, limit?: number): Promise<string[]>;

  /**
   * Delete old password history entries beyond the specified limit
   * Keeps only the most recent entries
   */
  cleanupOldEntries(userId: string, keepCount?: number): Promise<void>;

  /**
   * Delete all password history for a user (used when user is deleted)
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Check if a user has any password history
   */
  hasPasswordHistory(userId: string): Promise<boolean>;

  /**
   * Count password history entries for a user
   */
  countByUserId(userId: string): Promise<number>;
}
