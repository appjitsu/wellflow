import * as bcrypt from 'bcrypt';

/**
 * Password Value Object
 * Represents a secure password with validation and hashing
 *
 * Business Rules (Sprint 3 Requirements):
 * - Minimum 8 characters
 * - Must contain at least one uppercase letter
 * - Must contain at least one lowercase letter
 * - Must contain at least one number
 * - Must contain at least one special character
 * - Cannot contain common patterns or dictionary words
 */
export class Password {
  private readonly hashedValue: string;
  private static readonly SALT_ROUNDS = 12;

  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue;
  }

  getHashedValue(): string {
    return this.hashedValue;
  }

  /**
   * Verify if a plain text password matches this hashed password
   */
  async verify(plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, this.hashedValue);
  }

  equals(other: Password): boolean {
    return this.hashedValue === other.hashedValue;
  }

  toString(): string {
    return '[PROTECTED]';
  }

  /**
   * Create a new Password from plain text (validates and hashes)
   */
  static async create(plainTextPassword: string): Promise<Password> {
    Password.validatePasswordStrength(plainTextPassword);
    const hashedValue = await bcrypt.hash(
      plainTextPassword,
      Password.SALT_ROUNDS,
    );
    return new Password(hashedValue);
  }

  /**
   * Create a Password from an already hashed value (for loading from database)
   */
  static fromHash(hashedValue: string): Password {
    if (!hashedValue || typeof hashedValue !== 'string') {
      throw new Error('Hashed password value is required');
    }
    return new Password(hashedValue);
  }

  /**
   * Validate password strength according to Sprint 3 requirements
   */
  private static validatePasswordStrength(password: string): void {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new Error('Password cannot exceed 128 characters');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    // Check for common weak patterns
    const weakPatterns = [
      /(.)\1{3,}/, // 4 or more repeated characters
      /123456|654321|abcdef|qwerty|password|admin/i, // Common sequences
    ];

    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        throw new Error('Password contains weak patterns and is not secure');
      }
    }

    // Check for whitespace at beginning or end
    if (password.trim() !== password) {
      throw new Error('Password cannot start or end with whitespace');
    }
  }

  /**
   * Generate a secure random password that meets all requirements
   */
  static generateSecure(length: number = 12): string {
    if (length < 8) {
      throw new Error(
        'Generated password length must be at least 8 characters',
      );
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let password = '';

    // Ensure at least one character from each required category
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining length with random characters from all categories
    const allChars = uppercase + lowercase + numbers + special;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
