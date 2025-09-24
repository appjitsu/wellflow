import { InsuranceType } from '../enums/vendor-status.enum';

/**
 * Insurance Coverage Value Object
 * Represents an insurance policy with coverage details
 *
 * Business Rules:
 * - Coverage amount must be positive
 * - Expiration date must be in the future
 * - Policy number must be provided
 * - Carrier must be a valid insurance company
 */
export class InsuranceCoverage {
  private readonly type: InsuranceType;
  private readonly carrier: string;
  private readonly policyNumber: string;
  private readonly coverageAmount: number;
  private readonly expirationDate: Date;
  private readonly effectiveDate: Date;
  private readonly isActive: boolean;

  constructor(
    type: InsuranceType,
    carrier: string,
    policyNumber: string,
    coverageAmount: number,
    expirationDate: Date,
    effectiveDate: Date = new Date(),
  ) {
    this.validateCoverage(
      carrier,
      policyNumber,
      coverageAmount,
      expirationDate,
      effectiveDate,
    );

    this.type = type;
    this.carrier = carrier.trim();
    this.policyNumber = policyNumber.trim();
    this.coverageAmount = coverageAmount;
    this.expirationDate = new Date(expirationDate);
    this.effectiveDate = new Date(effectiveDate);
    this.isActive = this.calculateIsActive();
  }

  getType(): InsuranceType {
    return this.type;
  }

  getCarrier(): string {
    return this.carrier;
  }

  getPolicyNumber(): string {
    return this.policyNumber;
  }

  getCoverageAmount(): number {
    return this.coverageAmount;
  }

  getExpirationDate(): Date {
    return new Date(this.expirationDate);
  }

  getEffectiveDate(): Date {
    return new Date(this.effectiveDate);
  }

  isCurrentlyActive(): boolean {
    return this.isActive;
  }

  isExpired(): boolean {
    return new Date() > this.expirationDate;
  }

  isEffective(): boolean {
    return new Date() >= this.effectiveDate;
  }

  daysUntilExpiration(): number {
    const now = new Date();
    const timeDiff = this.expirationDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  isExpiringWithinDays(days: number): boolean {
    return this.daysUntilExpiration() <= days && !this.isExpired();
  }

  /**
   * Check if coverage meets minimum requirements for vendor type
   */
  meetsMinimumRequirements(vendorType: string): boolean {
    const minimumCoverages: Record<string, Record<InsuranceType, number>> = {
      service: {
        [InsuranceType.GENERAL_LIABILITY]: 1000000,
        [InsuranceType.WORKERS_COMPENSATION]: 1000000,
        [InsuranceType.AUTO_LIABILITY]: 1000000,
        [InsuranceType.PROFESSIONAL_LIABILITY]: 0,
        [InsuranceType.ENVIRONMENTAL_LIABILITY]: 0,
        [InsuranceType.UMBRELLA]: 0,
      },
      contractor: {
        [InsuranceType.GENERAL_LIABILITY]: 2000000,
        [InsuranceType.WORKERS_COMPENSATION]: 1000000,
        [InsuranceType.AUTO_LIABILITY]: 1000000,
        [InsuranceType.PROFESSIONAL_LIABILITY]: 0,
        [InsuranceType.ENVIRONMENTAL_LIABILITY]: 1000000,
        [InsuranceType.UMBRELLA]: 0,
      },
      supplier: {
        [InsuranceType.GENERAL_LIABILITY]: 1000000,
        [InsuranceType.WORKERS_COMPENSATION]: 0,
        [InsuranceType.AUTO_LIABILITY]: 1000000,
        [InsuranceType.PROFESSIONAL_LIABILITY]: 0,
        [InsuranceType.ENVIRONMENTAL_LIABILITY]: 0,
        [InsuranceType.UMBRELLA]: 0,
      },
    };

    const requirements = minimumCoverages[vendorType.toLowerCase()];
    if (!requirements) {
      return true; // No specific requirements for this vendor type
    }

    const minimumAmount = requirements[this.type];
    return minimumAmount === 0 || this.coverageAmount >= minimumAmount;
  }

  equals(other: InsuranceCoverage): boolean {
    return (
      this.type === other.type &&
      this.carrier === other.carrier &&
      this.policyNumber === other.policyNumber &&
      this.coverageAmount === other.coverageAmount &&
      this.expirationDate.getTime() === other.expirationDate.getTime() &&
      this.effectiveDate.getTime() === other.effectiveDate.getTime()
    );
  }

  toString(): string {
    return `${this.type}: ${this.carrier} - ${this.policyNumber} ($${this.coverageAmount.toLocaleString()}) expires ${this.expirationDate.toDateString()}`;
  }

  private validateCoverage(
    carrier: string,
    policyNumber: string,
    coverageAmount: number,
    expirationDate: Date,
    effectiveDate: Date,
  ): void {
    if (!carrier || carrier.trim().length === 0) {
      throw new Error('Insurance carrier is required');
    }

    if (!policyNumber || policyNumber.trim().length === 0) {
      throw new Error('Policy number is required');
    }

    if (coverageAmount <= 0) {
      throw new Error('Coverage amount must be positive');
    }

    if (!(expirationDate instanceof Date) || isNaN(expirationDate.getTime())) {
      throw new Error('Valid expiration date is required');
    }

    if (!(effectiveDate instanceof Date) || isNaN(effectiveDate.getTime())) {
      throw new Error('Valid effective date is required');
    }

    if (effectiveDate >= expirationDate) {
      throw new Error('Effective date must be before expiration date');
    }
  }

  private calculateIsActive(): boolean {
    const now = new Date();
    return now >= this.effectiveDate && now <= this.expirationDate;
  }

  /**
   * Create a renewal coverage with new expiration date
   */
  renew(newExpirationDate: Date, newPolicyNumber?: string): InsuranceCoverage {
    return new InsuranceCoverage(
      this.type,
      this.carrier,
      newPolicyNumber || this.policyNumber,
      this.coverageAmount,
      newExpirationDate,
      this.expirationDate, // New effective date is old expiration date
    );
  }

  /**
   * Create coverage with updated amount
   */
  updateCoverage(newCoverageAmount: number): InsuranceCoverage {
    return new InsuranceCoverage(
      this.type,
      this.carrier,
      this.policyNumber,
      newCoverageAmount,
      this.expirationDate,
      this.effectiveDate,
    );
  }
}
