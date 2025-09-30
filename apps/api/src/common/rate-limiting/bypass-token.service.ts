import { Injectable, Logger, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { randomBytes, createHash } from 'crypto';

// Constants
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export interface BypassToken {
  token: string;
  hashedToken: string;
  expiresAt: Date;
  createdAt: Date;
  createdBy: string;
  usageCount: number;
  maxUsage: number;
  reason: string;
  ipRestrictions?: string[]; // Optional IP whitelist
}

export interface BypassTokenValidationResult {
  isValid: boolean;
  token?: BypassToken;
  reason?: string;
}

export interface CreateBypassTokenRequest {
  reason: string;
  createdBy: string;
  durationMs?: number; // Default: 1 hour
  maxUsage?: number; // Default: 100
  ipRestrictions?: string[]; // Optional IP whitelist
}

/**
 * Emergency Bypass Token Service
 *
 * Provides secure bypass tokens for critical operations during emergencies.
 * Tokens are time-limited, usage-limited, and optionally IP-restricted.
 */
@Injectable()
export class BypassTokenService {
  private readonly logger = new Logger(BypassTokenService.name);

  // Default configuration
  private readonly defaultConfig = {
    tokenLength: 32, // bytes (64 hex characters)
    defaultDurationMs: 60 * 60 * 1000, // 1 hour
    defaultMaxUsage: 100,
    maxTokensPerUser: 5,
    cleanupIntervalMs: 15 * 60 * 1000, // 15 minutes
  };

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis | null,
  ) {
    // Start cleanup process
    this.startCleanupProcess();
  }

  /**
   * Create a new bypass token
   */
  async createBypassToken(
    request: CreateBypassTokenRequest,
  ): Promise<BypassToken> {
    try {
      // Generate secure random token
      const tokenBytes = randomBytes(this.defaultConfig.tokenLength);
      const token = tokenBytes.toString('hex');
      const hashedToken = this.hashToken(token);

      const now = new Date();
      const expiresAt = new Date(
        now.getTime() +
          (request.durationMs || this.defaultConfig.defaultDurationMs),
      );

      const bypassToken: BypassToken = {
        token,
        hashedToken,
        expiresAt,
        createdAt: now,
        createdBy: request.createdBy,
        usageCount: 0,
        maxUsage: request.maxUsage || this.defaultConfig.defaultMaxUsage,
        reason: request.reason,
        ipRestrictions: request.ipRestrictions,
      };

      // Store in Redis if available
      if (this.redis) {
        await this.storeToken(bypassToken);
      }

      this.logger.log('Emergency bypass token created', {
        hashedToken,
        createdBy: request.createdBy,
        reason: request.reason,
        expiresAt,
        maxUsage: bypassToken.maxUsage,
        ipRestrictions: request.ipRestrictions?.length || 0,
      });

      return bypassToken;
    } catch (error) {
      this.logger.error('Error creating bypass token', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        createdBy: request.createdBy,
        reason: request.reason,
      });
      throw new Error('Failed to create bypass token');
    }
  }

  /**
   * Validate and use a bypass token
   */
  async validateAndUseToken(
    token: string,
    ipAddress?: string,
  ): Promise<BypassTokenValidationResult> {
    if (!token || token.length === 0) {
      return {
        isValid: false,
        reason: 'Token is required',
      };
    }

    try {
      const hashedToken = this.hashToken(token);
      const storedToken = await this.getStoredToken(hashedToken);

      if (!storedToken) {
        this.logger.warn('Invalid bypass token attempted', {
          hashedToken: hashedToken.substring(0, 8) + '...',
          ipAddress,
        });
        return {
          isValid: false,
          reason: 'Token not found or invalid',
        };
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        this.logger.warn('Expired bypass token attempted', {
          hashedToken: hashedToken.substring(0, 8) + '...',
          expiresAt: storedToken.expiresAt,
          ipAddress,
        });
        return {
          isValid: false,
          reason: 'Token has expired',
        };
      }

      // Check usage limits
      if (storedToken.usageCount >= storedToken.maxUsage) {
        this.logger.warn('Usage limit exceeded for bypass token', {
          hashedToken: hashedToken.substring(0, 8) + '...',
          usageCount: storedToken.usageCount,
          maxUsage: storedToken.maxUsage,
          ipAddress,
        });
        return {
          isValid: false,
          reason: 'Token usage limit exceeded',
        };
      }

      // Check IP restrictions if specified
      if (storedToken.ipRestrictions && storedToken.ipRestrictions.length > 0) {
        if (!ipAddress || !storedToken.ipRestrictions.includes(ipAddress)) {
          this.logger.warn('IP restriction violation for bypass token', {
            hashedToken: hashedToken.substring(0, 8) + '...',
            ipAddress,
            allowedIPs: storedToken.ipRestrictions,
          });
          return {
            isValid: false,
            reason: 'IP address not authorized for this token',
          };
        }
      }

      // Token is valid - increment usage count
      storedToken.usageCount += 1;
      if (this.redis) {
        await this.updateTokenUsage(hashedToken, storedToken.usageCount);
      }

      this.logger.log('Bypass token used successfully', {
        hashedToken: hashedToken.substring(0, 8) + '...',
        usageCount: storedToken.usageCount,
        maxUsage: storedToken.maxUsage,
        createdBy: storedToken.createdBy,
        reason: storedToken.reason,
        ipAddress,
      });

      return {
        isValid: true,
        token: storedToken,
      };
    } catch (error) {
      this.logger.error('Error validating bypass token', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return {
        isValid: false,
        reason: 'Token validation failed',
      };
    }
  }

  /**
   * Revoke a bypass token
   */
  async revokeToken(token: string, revokedBy: string): Promise<boolean> {
    try {
      const hashedToken = this.hashToken(token);

      if (this.redis) {
        const tokenKey = `bypass:token:${hashedToken}`;
        const deleted = await this.redis.del(tokenKey);

        if (deleted > 0) {
          this.logger.log('Bypass token revoked', {
            hashedToken: hashedToken.substring(0, 8) + '...',
            revokedBy,
          });
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error revoking bypass token', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        revokedBy,
      });
      return false;
    }
  }

  /**
   * List active bypass tokens for a user
   */
  async listUserTokens(userId: string): Promise<Omit<BypassToken, 'token'>[]> {
    if (!this.redis) return [];

    try {
      const pattern = 'bypass:token:*';
      const keys = await this.redis.keys(pattern);
      const tokens: Omit<BypassToken, 'token'>[] = [];

      for (const key of keys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const token = JSON.parse(tokenData) as BypassToken;
          // Convert string dates back to Date objects for comparison
          const expiresAt = new Date(token.expiresAt);
          const createdAt = new Date(token.createdAt);

          if (token.createdBy === userId && new Date() <= expiresAt) {
            // Remove the actual token from the response for security
            const tokenWithoutSecret = {
              hashedToken: token.hashedToken,
              expiresAt: expiresAt,
              createdAt: createdAt,
              createdBy: token.createdBy,
              usageCount: token.usageCount,
              maxUsage: token.maxUsage,
              reason: token.reason,
              ipRestrictions: token.ipRestrictions,
            };
            tokens.push(tokenWithoutSecret);
          }
        }
      }

      return tokens.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } catch (error) {
      this.logger.error('Error listing user tokens', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        userId,
      });
      return [];
    }
  }

  /**
   * Get bypass token statistics
   */
  async getTokenStats(): Promise<{
    activeTokens: number;
    totalUsage: number;
    expiredTokens: number;
  }> {
    if (!this.redis) {
      return { activeTokens: 0, totalUsage: 0, expiredTokens: 0 };
    }

    try {
      const pattern = 'bypass:token:*';
      const keys = await this.redis.keys(pattern);

      let activeTokens = 0;
      let totalUsage = 0;
      let expiredTokens = 0;
      const now = new Date();

      for (const key of keys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const token = JSON.parse(tokenData) as BypassToken;
          totalUsage += token.usageCount;

          // Convert string date back to Date object for comparison
          const expiresAt = new Date(token.expiresAt);
          if (now <= expiresAt) {
            activeTokens++;
          } else {
            expiredTokens++;
          }
        }
      }

      return { activeTokens, totalUsage, expiredTokens };
    } catch (error) {
      this.logger.error('Error getting token stats', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
      return { activeTokens: 0, totalUsage: 0, expiredTokens: 0 };
    }
  }

  /**
   * Hash a token for secure storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Store token in Redis
   */
  private async storeToken(token: BypassToken): Promise<void> {
    if (!this.redis) return;

    const tokenKey = `bypass:token:${token.hashedToken}`;
    const ttlSeconds = Math.ceil(
      (token.expiresAt.getTime() - Date.now()) / 1000,
    );

    // Store token data (without the plain token)
    const tokenData = {
      hashedToken: token.hashedToken,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      createdBy: token.createdBy,
      usageCount: token.usageCount,
      maxUsage: token.maxUsage,
      reason: token.reason,
      ipRestrictions: token.ipRestrictions,
    };
    await this.redis.setex(tokenKey, ttlSeconds, JSON.stringify(tokenData));
  }

  /**
   * Get stored token from Redis
   */
  private async getStoredToken(
    hashedToken: string,
  ): Promise<BypassToken | null> {
    if (!this.redis) return null;

    const tokenKey = `bypass:token:${hashedToken}`;
    const tokenData = await this.redis.get(tokenKey);

    if (!tokenData) return null;

    const parsed = JSON.parse(tokenData) as BypassToken;
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      expiresAt: new Date(parsed.expiresAt),
    } as BypassToken;
  }

  /**
   * Update token usage count
   */
  private async updateTokenUsage(
    hashedToken: string,
    usageCount: number,
  ): Promise<void> {
    if (!this.redis) return;

    const tokenKey = `bypass:token:${hashedToken}`;
    const tokenData = await this.redis.get(tokenKey);

    if (tokenData) {
      const token = JSON.parse(tokenData) as BypassToken;
      token.usageCount = usageCount;

      const ttl = await this.redis.ttl(tokenKey);
      if (ttl > 0) {
        await this.redis.setex(tokenKey, ttl, JSON.stringify(token));
      }
    }
  }

  /**
   * Start cleanup process for expired tokens
   */
  private startCleanupProcess(): void {
    setInterval(() => {
      this.cleanupExpiredTokens().catch((error: unknown) => {
        this.logger.error('Error in cleanup process', {
          error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        });
      });
    }, this.defaultConfig.cleanupIntervalMs);
  }

  /**
   * Clean up expired tokens
   */
  private async cleanupExpiredTokens(): Promise<void> {
    if (!this.redis) return;

    try {
      const pattern = 'bypass:token:*';
      const keys = await this.redis.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const token = JSON.parse(tokenData) as BypassToken;
          if (new Date() > new Date(token.expiresAt)) {
            await this.redis.del(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug('Cleaned up expired bypass tokens', {
          cleanedCount,
        });
      }
    } catch (error) {
      this.logger.error('Error cleaning up expired tokens', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
    }
  }
}
