/**
 * Email Value Object
 * Represents a validated email address with business rules
 *
 * Business Rules:
 * - Must be a valid email format
 * - Must be normalized (lowercase)
 * - Cannot be empty or whitespace only
 * - Maximum length of 255 characters
 */
export class Email {
  private readonly value: string;

  constructor(value: string) {
    this.validateEmail(value);
    this.value = this.normalizeEmail(value);
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split('@')[1] || '';
  }

  getLocalPart(): string {
    return this.value.split('@')[0] || '';
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private validateEmail(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('Email is required and must be a string');
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      throw new Error('Email cannot be empty or whitespace only');
    }

    if (trimmedValue.length > 255) {
      throw new Error('Email cannot exceed 255 characters');
    }

    // RFC 5322 compliant email regex (simplified but robust)
    const emailRegex =
      // eslint-disable-next-line security/detect-unsafe-regex
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(trimmedValue)) {
      throw new Error('Invalid email format');
    }

    // Additional business rules
    if (trimmedValue.includes('..')) {
      throw new Error('Email cannot contain consecutive dots');
    }

    if (trimmedValue.startsWith('.') || trimmedValue.endsWith('.')) {
      throw new Error('Email cannot start or end with a dot');
    }
  }

  private normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * Factory method for creating Email from string
   */
  static create(value: string): Email {
    return new Email(value);
  }

  /**
   * Check if email belongs to a specific domain
   */
  isFromDomain(domain: string): boolean {
    return this.getDomain().toLowerCase() === domain.toLowerCase();
  }

  /**
   * Check if email is from a common business domain
   */
  isBusinessEmail(): boolean {
    const businessDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'protonmail.com',
    ];

    return !businessDomains.includes(this.getDomain().toLowerCase());
  }
}
