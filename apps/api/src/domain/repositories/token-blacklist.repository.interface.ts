import { TokenBlacklistEntity } from '../entities/token-blacklist.entity';

/**
 * Token Blacklist Repository Interface
 *
 * Defines the contract for token blacklist data access operations.
 * Follows the Repository pattern established in the codebase.
 */
export interface TokenBlacklistRepository {
  /**
   * Save a token blacklist entry
   */
  save(tokenBlacklist: TokenBlacklistEntity): Promise<TokenBlacklistEntity>;

  /**
   * Find a blacklist entry by JTI (JWT ID)
   */
  findByJti(jti: string): Promise<TokenBlacklistEntity | null>;

  /**
   * Check if a token is blacklisted by JTI
   */
  isTokenBlacklisted(jti: string): Promise<boolean>;

  /**
   * Find all blacklisted tokens for a user
   */
  findByUserId(userId: string): Promise<TokenBlacklistEntity[]>;

  /**
   * Find blacklisted tokens by user and token type
   */
  findByUserIdAndTokenType(
    userId: string,
    tokenType: string,
  ): Promise<TokenBlacklistEntity[]>;

  /**
   * Delete expired blacklist entries (cleanup operation)
   */
  deleteExpiredEntries(): Promise<number>;

  /**
   * Delete all blacklist entries for a user (e.g., when user is deleted)
   */
  deleteByUserId(userId: string): Promise<number>;

  /**
   * Count total blacklisted tokens
   */
  count(): Promise<number>;

  /**
   * Count blacklisted tokens for a user
   */
  countByUserId(userId: string): Promise<number>;
}
