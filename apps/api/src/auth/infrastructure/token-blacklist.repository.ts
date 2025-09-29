import { Injectable, Logger } from '@nestjs/common';
import { eq, and, lt, gt, count, desc } from 'drizzle-orm';
import { TokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';
import { TokenBlacklistEntity } from '../../domain/entities/token-blacklist.entity';
import { tokenBlacklist } from '../../database/schemas/token-blacklist';
import { DatabaseService } from '../../database/database.service';

/**
 * Token Blacklist Repository Implementation
 *
 * Implements the TokenBlacklistRepository interface using Drizzle ORM.
 * Follows the established Repository pattern in the codebase.
 * Maps between domain entities and database schema.
 */
@Injectable()
export class TokenBlacklistRepositoryImpl implements TokenBlacklistRepository {
  private readonly logger = new Logger(TokenBlacklistRepositoryImpl.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Save a token blacklist entry
   */
  async save(entity: TokenBlacklistEntity): Promise<TokenBlacklistEntity> {
    try {
      const db = this.databaseService.getDb();
      const data = this.mapToSchema(entity);

      const result = await db.insert(tokenBlacklist).values(data).returning();

      if (!result[0]) {
        throw new Error('Failed to save token blacklist entry');
      }

      return this.mapToEntity(result[0]);
    } catch (error) {
      this.logger.error('Error saving token blacklist entry:', error);
      throw error;
    }
  }

  /**
   * Find a blacklist entry by JTI (JWT ID)
   */
  async findByJti(jti: string): Promise<TokenBlacklistEntity | null> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select()
        .from(tokenBlacklist)
        .where(eq(tokenBlacklist.jti, jti))
        .limit(1);

      if (result.length === 0 || !result[0]) {
        return null;
      }

      return this.mapToEntity(result[0]);
    } catch (error) {
      this.logger.error('Error finding token blacklist entry by JTI:', error);
      return null;
    }
  }

  /**
   * Check if a token is blacklisted by JTI
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select({ count: count() })
        .from(tokenBlacklist)
        .where(
          and(
            eq(tokenBlacklist.jti, jti),
            // Only consider non-expired entries (expiresAt > now)
            gt(tokenBlacklist.expiresAt, new Date()),
          ),
        );

      return (result[0]?.count ?? 0) > 0;
    } catch (error) {
      this.logger.error('Error checking if token is blacklisted:', error);
      // In case of error, assume token is not blacklisted to avoid blocking valid tokens
      return false;
    }
  }

  /**
   * Find all blacklisted tokens for a user
   */
  async findByUserId(userId: string): Promise<TokenBlacklistEntity[]> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select()
        .from(tokenBlacklist)
        .where(eq(tokenBlacklist.userId, userId))
        .orderBy(desc(tokenBlacklist.blacklistedAt));

      return result.map((row) => this.mapToEntity(row));
    } catch (error) {
      this.logger.error(
        'Error finding token blacklist entries by user ID:',
        error,
      );
      return [];
    }
  }

  /**
   * Find blacklisted tokens by user and token type
   */
  async findByUserIdAndTokenType(
    userId: string,
    tokenType: string,
  ): Promise<TokenBlacklistEntity[]> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select()
        .from(tokenBlacklist)
        .where(
          and(
            eq(tokenBlacklist.userId, userId),
            eq(tokenBlacklist.tokenType, tokenType),
          ),
        )
        .orderBy(tokenBlacklist.blacklistedAt);

      return result.map((row) => this.mapToEntity(row));
    } catch (error) {
      this.logger.error(
        'Error finding token blacklist entries by user ID and token type:',
        error,
      );
      return [];
    }
  }

  /**
   * Delete expired blacklist entries (cleanup operation)
   */
  async deleteExpiredEntries(): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .delete(tokenBlacklist)
        .where(lt(tokenBlacklist.expiresAt, new Date()));

      this.logger.log(
        `Cleaned up ${result.rowCount || 0} expired token blacklist entries`,
      );
      return result.rowCount || 0;
    } catch (error) {
      this.logger.error(
        'Error deleting expired token blacklist entries:',
        error,
      );
      return 0;
    }
  }

  /**
   * Delete all blacklist entries for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .delete(tokenBlacklist)
        .where(eq(tokenBlacklist.userId, userId));

      return result.rowCount || 0;
    } catch (error) {
      this.logger.error(
        'Error deleting token blacklist entries by user ID:',
        error,
      );
      return 0;
    }
  }

  /**
   * Count total blacklisted tokens
   */
  async count(): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = await db.select({ count: count() }).from(tokenBlacklist);

      return result[0]?.count ?? 0;
    } catch (error) {
      this.logger.error('Error counting token blacklist entries:', error);
      return 0;
    }
  }

  /**
   * Count blacklisted tokens for a user
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      const db = this.databaseService.getDb();
      const result = await db
        .select({ count: count() })
        .from(tokenBlacklist)
        .where(eq(tokenBlacklist.userId, userId));

      return result[0]?.count ?? 0;
    } catch (error) {
      this.logger.error(
        'Error counting token blacklist entries by user ID:',
        error,
      );
      return 0;
    }
  }

  // Private mapping methods

  /**
   * Map domain entity to database schema
   */
  private mapToSchema(
    entity: TokenBlacklistEntity,
  ): typeof tokenBlacklist.$inferInsert {
    return {
      id: entity.getId(),
      jti: entity.getJti(),
      userId: entity.getUserId(),
      tokenType: entity.getTokenType(),
      blacklistedAt: entity.getBlacklistedAt(),
      expiresAt: entity.getExpiresAt(),
      reason: entity.getReason(),
      ipAddress: entity.getIpAddress(),
      userAgent: entity.getUserAgent(),
    };
  }

  /**
   * Map database schema to domain entity
   */
  private mapToEntity(
    data: typeof tokenBlacklist.$inferSelect,
  ): TokenBlacklistEntity {
    return TokenBlacklistEntity.fromDatabase({
      id: data.id,
      jti: data.jti,
      userId: data.userId,
      tokenType: data.tokenType,
      blacklistedAt: data.blacklistedAt,
      expiresAt: data.expiresAt,
      reason: data.reason,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  }
}
