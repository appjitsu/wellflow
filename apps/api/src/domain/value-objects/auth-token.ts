import { randomBytes } from 'crypto';

/**
 * Authentication Token Value Object
 * Represents secure tokens for email verification, password reset, etc.
 *
 * Business Rules:
 * - Tokens must be cryptographically secure
 * - Tokens have expiration dates
 * - Tokens are single-use (should be invalidated after use)
 * - Tokens must be URL-safe for email links
 */
export class AuthToken {
  private readonly value: string;
  private readonly expiresAt: Date;
  private readonly tokenType: AuthTokenType;

  constructor(value: string, expiresAt: Date, tokenType: AuthTokenType) {
    this.validateToken(value);
    this.validateExpiration(expiresAt);

    this.value = value;
    this.expiresAt = expiresAt;
    this.tokenType = tokenType;
  }

  getValue(): string {
    return this.value;
  }

  getExpiresAt(): Date {
    return new Date(this.expiresAt);
  }

  getTokenType(): AuthTokenType {
    return this.tokenType;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isExpired();
  }

  equals(other: AuthToken): boolean {
    return this.value === other.value && this.tokenType === other.tokenType;
  }

  toString(): string {
    return `[${this.tokenType}:${this.value.substring(0, 8)}...]`;
  }

  /**
   * Create a new email verification token (24 hours expiry)
   */
  static createEmailVerificationToken(): AuthToken {
    const token = AuthToken.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return new AuthToken(token, expiresAt, AuthTokenType.EMAIL_VERIFICATION);
  }

  /**
   * Create a new password reset token (1 hour expiry)
   */
  static createPasswordResetToken(): AuthToken {
    const token = AuthToken.generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return new AuthToken(token, expiresAt, AuthTokenType.PASSWORD_RESET);
  }

  /**
   * Create a refresh token (7 days expiry)
   */
  static createRefreshToken(): AuthToken {
    const token = AuthToken.generateSecureToken(64); // Longer for refresh tokens
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return new AuthToken(token, expiresAt, AuthTokenType.REFRESH_TOKEN);
  }

  /**
   * Create token from existing values (for loading from database)
   */
  static fromValues(
    value: string,
    expiresAt: Date,
    tokenType: AuthTokenType,
  ): AuthToken {
    return new AuthToken(value, expiresAt, tokenType);
  }

  private validateToken(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('Token value is required and must be a string');
    }

    if (value.length < 32) {
      throw new Error('Token must be at least 32 characters long');
    }

    // Ensure token is URL-safe (base64url characters only)
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      throw new Error('Token must contain only URL-safe characters');
    }
  }

  private validateExpiration(expiresAt: Date): void {
    if (!expiresAt || !(expiresAt instanceof Date)) {
      throw new Error('Token expiration date is required and must be a Date');
    }

    if (isNaN(expiresAt.getTime())) {
      throw new Error('Token expiration date must be a valid Date');
    }

    if (expiresAt <= new Date()) {
      throw new Error('Token expiration date must be in the future');
    }
  }

  /**
   * Generate a cryptographically secure, URL-safe token
   */
  private static generateSecureToken(length: number = 32): string {
    const bytes = randomBytes(Math.ceil((length * 3) / 4)); // Base64 encoding increases size by ~33%
    return bytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
      .substring(0, length);
  }

  /**
   * Get remaining time until expiration in milliseconds
   */
  getTimeUntilExpiration(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }

  /**
   * Check if token expires within the specified minutes
   */
  expiresWithin(minutes: number): boolean {
    const expirationThreshold = new Date(Date.now() + minutes * 60 * 1000);
    return this.expiresAt <= expirationThreshold;
  }
}

/**
 * Authentication Token Types
 */
export enum AuthTokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
}
