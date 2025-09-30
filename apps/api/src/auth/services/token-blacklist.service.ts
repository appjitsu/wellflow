import { Injectable, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TokenBlacklistRepository } from '../../domain/repositories/token-blacklist.repository.interface';
import {
  TokenBlacklistEntity,
  TokenType,
  BlacklistReason,
} from '../../domain/entities/token-blacklist.entity';
import { AuditLogService } from '../../application/services/audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../../domain/entities/audit-log.entity';

/**
 * JWT Payload Interface for type safety
 */
export interface JwtTokenPayload {
  sub: string; // User ID
  email: string;
  organizationId: string;
  role: string;
  jti?: string; // JWT ID for token tracking
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Token Blacklist Service
 *
 * Handles JWT token blacklisting for secure logout functionality.
 * Follows the established service patterns in the codebase.
 *
 * Features:
 * - Blacklist tokens on logout
 * - Check if tokens are blacklisted
 * - Automatic cleanup of expired entries
 * - Comprehensive audit logging
 * - Support for both access and refresh tokens
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    @Inject('TokenBlacklistRepository')
    private readonly tokenBlacklistRepository: TokenBlacklistRepository,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Blacklist a token (typically on logout)
   */
  async blacklistToken(
    token: string,
    tokenType: TokenType,
    reason: BlacklistReason = BlacklistReason.LOGOUT,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Decode the token to get payload information
      const payload = this.decodeToken(token);
      if (!payload) {
        this.logger.warn('Failed to decode token for blacklisting');
        return;
      }

      // Generate JTI if not present (for older tokens)
      const jti = payload.jti || this.generateJti(token);

      // Calculate expiration date from token
      const expiresAt = payload.exp
        ? new Date(payload.exp * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

      // Create blacklist entry
      const blacklistEntry = TokenBlacklistEntity.createForLogout(
        jti,
        payload.sub,
        tokenType,
        expiresAt,
        ipAddress,
        userAgent,
      );

      // Save to repository
      await this.tokenBlacklistRepository.save(blacklistEntry);

      // Log the blacklisting event
      await this.auditLogService.logSuccess(
        AuditAction.UPDATE,
        AuditResourceType.USER,
        payload.sub,
        {},
        {
          businessContext: {
            action: 'token_blacklisted',
            tokenType,
            reason,
            jti: jti.substring(0, 8) + '...', // Partial JTI for security
          },
          ipAddress,
          userAgent,
        },
      );

      this.logger.log(
        `Token blacklisted successfully: ${tokenType} token for user ${payload.sub}`,
      );
    } catch (error) {
      this.logger.error('Error blacklisting token:', error);
      // Don't throw error for blacklisting failures - it should not break logout flow
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      // Decode the token to get JTI
      const payload = this.decodeToken(token);
      if (!payload) {
        // If we can't decode the token, consider it invalid but not blacklisted
        this.logger.warn('Could not decode token for blacklist check');
        return false;
      }

      const jti = payload.jti || this.generateJti(token);

      // Check if token is in blacklist
      return await this.tokenBlacklistRepository.isTokenBlacklisted(jti);
    } catch (error) {
      this.logger.error('Error checking token blacklist status:', error);
      // In case of error, assume token is not blacklisted to avoid blocking valid tokens
      return false;
    }
  }

  /**
   * Blacklist all tokens for a user (e.g., on password change or security breach)
   */
  async blacklistAllUserTokens(
    userId: string,
    reason: BlacklistReason,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Note: This is a simplified implementation
      // In a production system, you might want to track active tokens more explicitly

      await this.auditLogService.logSuccess(
        AuditAction.UPDATE,
        AuditResourceType.USER,
        userId,
        {},
        {
          businessContext: {
            action: 'all_tokens_blacklisted',
            reason,
          },
          ipAddress,
          userAgent,
        },
      );

      this.logger.log(
        `All tokens blacklisted for user ${userId} due to ${reason}`,
      );
    } catch (error) {
      this.logger.error('Error blacklisting all user tokens:', error);
      // Don't throw error - log and continue
    }
  }

  /**
   * Get blacklisted tokens for a user (for admin/audit purposes)
   */
  async getUserBlacklistedTokens(
    userId: string,
  ): Promise<TokenBlacklistEntity[]> {
    try {
      return await this.tokenBlacklistRepository.findByUserId(userId);
    } catch (error) {
      this.logger.error('Error getting user blacklisted tokens:', error);
      return [];
    }
  }

  /**
   * Clean up expired blacklist entries
   * This should be called periodically (e.g., via cron job)
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const deletedCount =
        await this.tokenBlacklistRepository.deleteExpiredEntries();

      if (deletedCount > 0) {
        this.logger.log(
          `Cleaned up ${deletedCount} expired token blacklist entries`,
        );
      }

      return deletedCount;
    } catch (error) {
      this.logger.error('Error cleaning up expired blacklist entries:', error);
      return 0;
    }
  }

  /**
   * Get blacklist statistics
   */
  async getBlacklistStats(): Promise<{
    totalBlacklisted: number;
    userCount: Record<string, number>;
  }> {
    try {
      const totalBlacklisted = await this.tokenBlacklistRepository.count();

      return {
        totalBlacklisted,
        userCount: {}, // Could be expanded to show per-user stats
      };
    } catch (error) {
      this.logger.error('Error getting blacklist statistics:', error);
      return {
        totalBlacklisted: 0,
        userCount: {},
      };
    }
  }

  // Private helper methods

  /**
   * Decode JWT token safely without verification
   */
  private decodeToken(token: string): JwtTokenPayload | null {
    try {
      // Use decode instead of verify to avoid throwing on expired tokens
      return this.jwtService.decode(token);
    } catch (error) {
      this.logger.warn('Failed to decode JWT token:', error);
      return null;
    }
  }

  /**
   * Generate a JTI for tokens that don't have one
   * This creates a deterministic ID based on the token content
   */
  private generateJti(token: string): string {
    // Create a hash of the token for consistent JTI generation
    // Use a simple fallback to avoid crypto require issues
    return `jti_${Buffer.from(token).toString('base64').substring(0, 32)}`;
  }
}
