/**
 * Password History Domain Entity
 * Represents a historical password entry for a user
 *
 * Business Rules:
 * - Each user can have maximum 5 password history entries
 * - Passwords are stored as bcrypt hashes (never plain text)
 * - Entries are automatically cleaned up when exceeding 5 entries
 * - Used to prevent password reuse (security requirement)
 * - Immutable once created (passwords cannot be changed in history)
 */
export class PasswordHistory {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly passwordHash: string,
    private readonly createdAt: Date = new Date(),
  ) {
    this.validatePasswordHash(passwordHash);
    this.validateUserId(userId);
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getPasswordHash(): string {
    return this.passwordHash;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  /**
   * Check if this password history entry matches a given password hash
   */
  matchesPasswordHash(passwordHash: string): boolean {
    return this.passwordHash === passwordHash;
  }

  /**
   * Check if this password history entry is older than specified days
   */
  isOlderThan(days: number): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.createdAt < cutoffDate;
  }

  /**
   * Factory method for creating new password history entries
   */
  static create(userId: string, passwordHash: string): PasswordHistory {
    const id = crypto.randomUUID();
    return new PasswordHistory(id, userId, passwordHash);
  }

  /**
   * Factory method for creating from database data
   */
  static fromDatabase(
    id: string,
    userId: string,
    passwordHash: string,
    createdAt: Date | string,
  ): PasswordHistory {
    // Validate ID format
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(id)) {
      throw new Error('ID must be a valid UUID');
    }

    // Validate createdAt
    const createdAtDate =
      createdAt instanceof Date ? createdAt : new Date(createdAt);
    if (isNaN(createdAtDate.getTime())) {
      throw new Error('CreatedAt must be a valid date');
    }

    return new PasswordHistory(id, userId, passwordHash, createdAtDate);
  }

  /**
   * Convert to database representation
   */
  toDatabaseObject(): {
    id: string;
    userId: string;
    passwordHash: string;
    createdAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      passwordHash: this.passwordHash,
      createdAt: this.createdAt,
    };
  }

  /**
   * Validate password hash format
   */
  private validatePasswordHash(passwordHash: string): void {
    if (!passwordHash || passwordHash.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }

    // Validate bcrypt hash format (starts with $2a$, $2b$, or $2y$ and has proper length)
    const bcryptPattern = /^\$2[aby]\$\d{2}\$.{53}$/;
    if (!bcryptPattern.test(passwordHash)) {
      throw new Error('Invalid bcrypt password hash format');
    }
  }

  /**
   * Validate user ID format
   */
  private validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    // Validate UUID format
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) {
      throw new Error('User ID must be a valid UUID');
    }
  }

  /**
   * Equality comparison
   */
  equals(other: PasswordHistory): boolean {
    return this.id === other.id;
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `PasswordHistory(id=${this.id}, userId=${this.userId}, createdAt=${this.createdAt.toISOString()})`;
  }
}
