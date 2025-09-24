/**
 * AFE Number Value Object
 * Represents a standardized Authorization for Expenditure identifier
 * Format: AFE-YYYY-NNNN (AFE-Year-Sequential)
 * Example: AFE-2024-0001, AFE-2024-0123
 */
export class AfeNumber {
  private readonly value: string;

  constructor(value: string) {
    this.validateAfeNumber(value);
    this.value = this.formatAfeNumber(value);
  }

  getValue(): string {
    return this.value;
  }

  getYear(): string {
    return this.value.split('-')[1] || '';
  }

  getSequentialNumber(): string {
    return this.value.split('-')[2] || '';
  }

  equals(other: AfeNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  private validateAfeNumber(value: string): void {
    if (!value) {
      throw new Error('AFE number cannot be empty');
    }

    // Remove any spaces and convert to uppercase
    const cleanValue = value.replace(/\s/g, '').toUpperCase();

    // Check if it matches the expected format (allow 1-4 digits for sequential number)
    const afePattern = /^AFE-?\d{4}-?\d{1,4}$/;
    if (!afePattern.test(cleanValue)) {
      throw new Error(
        'Invalid AFE number format. Expected format: AFE-YYYY-NNNN (e.g., AFE-2024-0001)',
      );
    }

    // Validate year is reasonable (between 1900 and current year + 10)
    const year = this.extractYear(cleanValue);
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 10) {
      throw new Error(
        `Invalid year in AFE number. Year must be between 1900 and ${currentYear + 10}`,
      );
    }

    // Validate sequential number is not zero
    const sequentialNumber = this.extractSequentialNumber(cleanValue);
    if (sequentialNumber === 0) {
      throw new Error('Sequential number in AFE number cannot be zero');
    }
  }

  private formatAfeNumber(value: string): string {
    // Remove any spaces and convert to uppercase
    const cleanValue = value.replace(/\s/g, '').toUpperCase();

    // Extract components
    const year = this.extractYear(cleanValue);
    const sequentialNumber = this.extractSequentialNumber(cleanValue);

    // Format as AFE-YYYY-NNNN with zero-padded sequential number
    return `AFE-${year}-${sequentialNumber.toString().padStart(4, '0')}`;
  }

  private extractYear(value: string): number {
    // Handle both AFE-YYYY-NNNN and AFEYYYY-NNNN formats
    const regex = /AFE-?(\d{4})/;
    const match = regex.exec(value);
    if (!match) {
      throw new Error('Could not extract year from AFE number');
    }
    return parseInt(match[1] || '0', 10);
  }

  private extractSequentialNumber(value: string): number {
    // Handle both AFE-YYYY-NNNN and AFEYYYY-NNNN formats (1-4 digits for sequential number)
    const regex = /AFE-?\d{4}-?(\d{1,4})/;
    const match = regex.exec(value);
    if (!match) {
      throw new Error('Could not extract sequential number from AFE number');
    }
    return parseInt(match[1] || '0', 10);
  }

  /**
   * Generate next AFE number for a given year
   */
  static generateNext(year: number, lastSequentialNumber: number): AfeNumber {
    const nextSequential = lastSequentialNumber + 1;
    const afeNumberString = `AFE-${year}-${nextSequential.toString().padStart(4, '0')}`;
    return new AfeNumber(afeNumberString);
  }

  /**
   * Create AFE number for current year
   */
  static forCurrentYear(sequentialNumber: number): AfeNumber {
    const currentYear = new Date().getFullYear();
    const afeNumberString = `AFE-${currentYear}-${sequentialNumber.toString().padStart(4, '0')}`;
    return new AfeNumber(afeNumberString);
  }

  /**
   * Parse AFE number from various formats
   */
  static parse(value: string): AfeNumber {
    return new AfeNumber(value);
  }
}
