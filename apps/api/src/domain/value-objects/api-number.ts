/**
 * API Number Value Object
 * Represents a standardized oil & gas well identifier
 * Format: XX-XXX-XXXXX (State-County-Unique)
 */
export class ApiNumber {
  private readonly value: string;

  constructor(value: string) {
    this.validateApiNumber(value);
    this.value = this.formatApiNumber(value);
  }

  private validateApiNumber(value: string): void {
    if (!value) {
      throw new Error('API Number cannot be empty');
    }

    // Remove any existing formatting
    const cleanValue = value.replace(/[-\s]/g, '');

    // Must be exactly 10 digits
    if (!/^\d{10}$/.test(cleanValue)) {
      throw new Error('API Number must be exactly 10 digits');
    }

    // Basic state code validation (first 2 digits)
    const stateCode = parseInt(cleanValue.substring(0, 2));
    if (stateCode < 1 || stateCode > 56) {
      throw new Error('Invalid state code in API Number');
    }
  }

  private formatApiNumber(value: string): string {
    const cleanValue = value.replace(/[-\s]/g, '');
    return `${cleanValue.substring(0, 2)}-${cleanValue.substring(2, 5)}-${cleanValue.substring(5)}`;
  }

  getValue(): string {
    return this.value;
  }

  getStateCode(): string {
    return this.value.substring(0, 2);
  }

  getCountyCode(): string {
    return this.value.substring(3, 6);
  }

  getUniqueNumber(): string {
    return this.value.substring(7);
  }

  equals(other: ApiNumber): boolean {
    if (!other) {
      return false;
    }
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
