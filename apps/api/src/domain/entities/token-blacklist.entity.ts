import { randomUUID } from 'crypto';

/**
 * Token Type Enumeration
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

/**
 * Blacklist Reason Enumeration
 */
export enum BlacklistReason {
  LOGOUT = 'logout',
  SECURITY_BREACH = 'security_breach',
  PASSWORD_CHANGE = 'password_change',
  ACCOUNT_LOCKED = 'account_locked',
  ADMIN_ACTION = 'admin_action',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

/**
 * Token Blacklist Domain Entity
 *
 * Represents a blacklisted JWT token in the system.
 * Follows Domain-Driven Design principles with business logic encapsulation.
 *
 * Business Rules:
 * - Tokens must have a valid JTI (JWT ID)
 * - Expiration date must be in the future when created
 * - User ID must be valid
 * - Blacklist reason must be specified
 * - IP address and user agent are optional but recommended for audit
 */
export class TokenBlacklistEntity {
  private readonly id: string;
  private readonly jti: string;
  private readonly userId: string;
  private readonly tokenType: TokenType;
  private readonly blacklistedAt: Date;
  private readonly expiresAt: Date;
  private readonly reason: BlacklistReason;
  private readonly ipAddress?: string;
  private readonly userAgent?: string;

  constructor(
    id: string,
    jti: string,
    userId: string,
    tokenType: TokenType,
    blacklistedAt: Date,
    expiresAt: Date,
    reason: BlacklistReason,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.validateJti(jti);
    this.validateUserId(userId);
    this.validateExpirationDate(expiresAt);

    this.id = id;
    this.jti = jti;
    this.userId = userId;
    this.tokenType = tokenType;
    this.blacklistedAt = blacklistedAt;
    this.expiresAt = expiresAt;
    this.reason = reason;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getJti(): string {
    return this.jti;
  }

  getUserId(): string {
    return this.userId;
  }

  getTokenType(): TokenType {
    return this.tokenType;
  }

  getBlacklistedAt(): Date {
    return new Date(this.blacklistedAt);
  }

  getExpiresAt(): Date {
    return new Date(this.expiresAt);
  }

  getReason(): BlacklistReason {
    return this.reason;
  }

  getIpAddress(): string | undefined {
    return this.ipAddress;
  }

  getUserAgent(): string | undefined {
    return this.userAgent;
  }

  // Business Logic Methods

  /**
   * Check if the blacklisted token has expired
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if this blacklist entry is still active
   */
  isActive(): boolean {
    return !this.isExpired();
  }

  /**
   * Get a display-friendly description of the blacklist entry
   */
  getDescription(): string {
    const tokenTypeDisplay =
      this.tokenType === TokenType.ACCESS ? 'Access' : 'Refresh';
    const reasonDisplay = this.reason.replace('_', ' ').toLowerCase();
    return `${tokenTypeDisplay} token blacklisted due to ${reasonDisplay}`;
  }

  /**
   * Get display information for the blacklist entry
   * Returns a formatted string with token type and reason
   */
  getDisplayInfo(): string {
    const tokenTypeDisplay =
      this.tokenType === TokenType.ACCESS ? 'Access Token' : 'Refresh Token';
    const reasonDisplay = this.reason.replace(/_/g, ' ');
    return `${tokenTypeDisplay} blacklisted due to ${reasonDisplay}`;
  }

  // Factory Methods

  /**
   * Create a new token blacklist entry for logout
   */
  static createForLogout(
    jti: string,
    userId: string,
    tokenType: TokenType,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): TokenBlacklistEntity {
    return new TokenBlacklistEntity(
      randomUUID(),
      jti,
      userId,
      tokenType,
      new Date(),
      expiresAt,
      BlacklistReason.LOGOUT,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Create a new token blacklist entry for security reasons
   */
  static createForSecurity(
    jti: string,
    userId: string,
    tokenType: TokenType,
    expiresAt: Date,
    reason: BlacklistReason = BlacklistReason.SECURITY_BREACH,
    ipAddress?: string,
    userAgent?: string,
  ): TokenBlacklistEntity {
    return new TokenBlacklistEntity(
      randomUUID(),
      jti,
      userId,
      tokenType,
      new Date(),
      expiresAt,
      reason,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Create from database data
   */
  static fromDatabase(data: {
    id: string;
    jti: string;
    userId: string;
    tokenType: string;
    blacklistedAt: Date;
    expiresAt: Date;
    reason: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): TokenBlacklistEntity {
    return new TokenBlacklistEntity(
      data.id,
      data.jti,
      data.userId,
      data.tokenType as TokenType,
      data.blacklistedAt,
      data.expiresAt,
      data.reason as BlacklistReason,
      data.ipAddress || undefined,
      data.userAgent || undefined,
    );
  }

  // Validation Methods

  private validateJti(jti: string): void {
    if (!jti || jti.trim().length === 0) {
      throw new Error('JTI cannot be empty');
    }
    if (jti.length > 255) {
      throw new Error('JTI cannot exceed 255 characters');
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    // Basic UUID format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      throw new Error('User ID must be a valid UUID');
    }
  }

  private validateExpirationDate(expiresAt: Date): void {
    if (!expiresAt || !(expiresAt instanceof Date)) {
      throw new Error('Expiration date must be a valid Date');
    }
    if (isNaN(expiresAt.getTime())) {
      throw new Error('Expiration date must be a valid Date');
    }
    // Note: We don't validate future date here because tokens can be blacklisted
    // after they've already expired (e.g., during cleanup operations)
  }

  // Utility Methods

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    id: string;
    jti: string;
    userId: string;
    tokenType: TokenType;
    blacklistedAt: Date;
    expiresAt: Date;
    reason: BlacklistReason;
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      id: this.id,
      jti: this.jti,
      userId: this.userId,
      tokenType: this.tokenType,
      blacklistedAt: this.blacklistedAt,
      expiresAt: this.expiresAt,
      reason: this.reason,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }

  /**
   * String representation for logging
   */
  toString(): string {
    return `TokenBlacklist(id=${this.id}, jti=${this.jti.substring(0, 8)}..., userId=${this.userId}, type=${this.tokenType}, reason=${this.reason})`;
  }
}
