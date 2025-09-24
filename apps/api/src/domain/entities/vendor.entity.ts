import { IEvent } from '@nestjs/cqrs';
import {
  VendorStatus,
  VendorType,
  VendorRating,
} from '../enums/vendor-status.enum';
import { VendorCreatedEvent } from '../events/vendor-created.event';
import { VendorStatusChangedEvent } from '../events/vendor-status-changed.event';
import { VendorRatingUpdatedEvent } from '../events/vendor-rating-updated.event';
import { VendorQualificationUpdatedEvent } from '../events/vendor-qualification-updated.event';

export interface VendorAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface VendorInsurance {
  generalLiability: {
    carrier: string;
    policyNumber: string;
    coverageAmount: number;
    expirationDate: Date;
  };
  workersCompensation?: {
    carrier: string;
    policyNumber: string;
    coverageAmount: number;
    expirationDate: Date;
  };
  autoLiability?: {
    carrier: string;
    policyNumber: string;
    coverageAmount: number;
    expirationDate: Date;
  };
}

export interface VendorCertification {
  id: string;
  name: string;
  issuingBody: string;
  certificationNumber: string;
  issueDate: Date;
  expirationDate: Date;
  isActive: boolean;
}

export interface VendorPerformanceMetrics {
  overallRating: VendorRating;
  safetyRating: VendorRating;
  qualityRating: VendorRating;
  timelinessRating: VendorRating;
  costEffectivenessRating: VendorRating;
  lastEvaluationDate: Date;
  totalJobsCompleted: number;
  averageJobValue: number;
  incidentCount: number;
}

/**
 * Vendor Entity - Aggregate Root
 * Represents a service provider or supplier in the oil & gas operations
 *
 * Business Rules:
 * - Must have valid insurance before being approved
 * - Must maintain required certifications for service type
 * - Performance ratings must be updated quarterly
 * - Cannot be deleted if active contracts exist
 * - Status changes must follow proper workflow
 */
export class Vendor {
  private id: string;
  private organizationId: string;
  private vendorCode: string;
  private vendorName: string;
  private vendorType: VendorType;
  private status: VendorStatus;
  private taxId?: string;
  private billingAddress: VendorAddress;
  private serviceAddress?: VendorAddress;
  private paymentTerms: string;
  private insurance!: VendorInsurance;
  private certifications: VendorCertification[];
  private performanceMetrics: VendorPerformanceMetrics;
  private isPrequalified: boolean;
  private prequalificationDate?: Date;
  private notes?: string;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;
  private domainEvents: IEvent[] = [];

  constructor(
    id: string,
    organizationId: string,
    vendorCode: string,
    vendorName: string,
    vendorType: VendorType,
    billingAddress: VendorAddress,
    paymentTerms: string,
    taxId?: string,
  ) {
    this.validateBusinessRules(
      vendorCode,
      vendorName,
      vendorType,
      billingAddress,
    );

    this.id = id;
    this.organizationId = organizationId;
    this.vendorCode = vendorCode;
    this.vendorName = vendorName;
    this.vendorType = vendorType;
    this.status = VendorStatus.PENDING;
    this.taxId = taxId;
    this.billingAddress = { ...billingAddress };
    this.paymentTerms = paymentTerms;
    this.certifications = [];
    this.isPrequalified = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;

    // Initialize default performance metrics
    this.performanceMetrics = {
      overallRating: VendorRating.NOT_RATED,
      safetyRating: VendorRating.NOT_RATED,
      qualityRating: VendorRating.NOT_RATED,
      timelinessRating: VendorRating.NOT_RATED,
      costEffectivenessRating: VendorRating.NOT_RATED,
      lastEvaluationDate: new Date(),
      totalJobsCompleted: 0,
      averageJobValue: 0,
      incidentCount: 0,
    };

    // Raise domain event for vendor creation
    this.addDomainEvent(
      new VendorCreatedEvent(
        this.id,
        this.organizationId,
        this.vendorName,
        this.vendorType,
        this.vendorCode,
      ),
    );
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getOrganizationId(): string {
    return this.organizationId;
  }

  getVendorCode(): string {
    return this.vendorCode;
  }

  getVendorName(): string {
    return this.vendorName;
  }

  getVendorType(): VendorType {
    return this.vendorType;
  }

  getStatus(): VendorStatus {
    return this.status;
  }

  getBillingAddress(): VendorAddress {
    return { ...this.billingAddress };
  }

  getInsurance(): VendorInsurance | undefined {
    return this.insurance ? { ...this.insurance } : undefined;
  }

  getCertifications(): VendorCertification[] {
    return [...this.certifications];
  }

  getPerformanceMetrics(): VendorPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getPaymentTerms(): string {
    return this.paymentTerms;
  }

  getTaxId(): string | undefined {
    return this.taxId;
  }

  getPrequalificationDate(): Date | undefined {
    return this.prequalificationDate;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getVersion(): number {
    return this.version;
  }

  isActive(): boolean {
    return (
      this.status === VendorStatus.APPROVED ||
      this.status === VendorStatus.PREQUALIFIED
    );
  }

  isQualified(): boolean {
    return (
      this.isPrequalified &&
      this.hasValidInsurance() &&
      this.hasRequiredCertifications()
    );
  }

  // Business Methods
  updateStatus(newStatus: VendorStatus, reason?: string): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
    }

    const oldStatus = this.status;
    this.status = newStatus;
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new VendorStatusChangedEvent(
        this.id,
        this.organizationId,
        oldStatus,
        newStatus,
        reason,
      ),
    );
  }

  updateInsurance(insurance: VendorInsurance): void {
    this.validateInsurance(insurance);
    this.insurance = { ...insurance };
    this.updatedAt = new Date();
    this.version++;

    // If vendor was pending and now has valid insurance, consider for approval
    if (this.status === VendorStatus.PENDING && this.hasValidInsurance()) {
      this.checkForAutoApproval();
    }
  }

  addCertification(certification: VendorCertification): void {
    this.validateCertification(certification);

    // Check for duplicate certification
    const existingCert = this.certifications.find(
      (cert) => cert.name === certification.name,
    );
    if (existingCert) {
      throw new Error(`Certification ${certification.name} already exists`);
    }

    this.certifications.push({ ...certification });
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new VendorQualificationUpdatedEvent(
        this.id,
        this.organizationId,
        'certification_added',
        certification.name,
      ),
    );
  }

  updatePerformanceRating(
    overallRating: VendorRating,
    safetyRating: VendorRating,
    qualityRating: VendorRating,
    timelinessRating: VendorRating,
    costEffectivenessRating: VendorRating,
    evaluatedBy: string,
  ): void {
    const oldRating = this.performanceMetrics.overallRating;

    this.performanceMetrics = {
      ...this.performanceMetrics,
      overallRating,
      safetyRating,
      qualityRating,
      timelinessRating,
      costEffectivenessRating,
      lastEvaluationDate: new Date(),
    };

    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new VendorRatingUpdatedEvent(
        this.id,
        this.organizationId,
        oldRating,
        overallRating,
        evaluatedBy,
      ),
    );
  }

  calculateAveragePerformanceRating(): number {
    // Oil & gas industry weighted performance calculation
    const ratings = [
      { rating: this.performanceMetrics.safetyRating, weight: 0.4 }, // Safety is most important
      { rating: this.performanceMetrics.qualityRating, weight: 0.25 },
      { rating: this.performanceMetrics.timelinessRating, weight: 0.2 },
      { rating: this.performanceMetrics.costEffectivenessRating, weight: 0.15 },
    ];

    const validRatings = ratings.filter(
      (r) => r.rating !== VendorRating.NOT_RATED,
    );
    if (validRatings.length === 0) return 0;

    // Normalize weights for valid ratings only
    const totalWeight = validRatings.reduce((sum, r) => sum + r.weight, 0);

    const weightedScore = validRatings.reduce((sum, r) => {
      const ratingValue = this.convertRatingToNumeric(r.rating);
      const normalizedWeight = r.weight / totalWeight;
      return sum + ratingValue * normalizedWeight;
    }, 0);

    return Math.round(weightedScore * 100) / 100; // Round to 2 decimal places
  }

  private convertRatingToNumeric(rating: VendorRating): number {
    switch (rating) {
      case VendorRating.EXCELLENT:
        return 5;
      case VendorRating.GOOD:
        return 4;
      case VendorRating.SATISFACTORY:
        return 3;
      case VendorRating.POOR:
        return 2;
      case VendorRating.UNACCEPTABLE:
        return 1;
      default:
        return 0;
    }
  }

  recordJobCompletion(
    jobValue: number,
    onTime: boolean,
    hasIncident: boolean,
  ): void {
    this.performanceMetrics.totalJobsCompleted++;
    this.performanceMetrics.averageJobValue =
      (this.performanceMetrics.averageJobValue *
        (this.performanceMetrics.totalJobsCompleted - 1) +
        jobValue) /
      this.performanceMetrics.totalJobsCompleted;

    if (hasIncident) {
      this.performanceMetrics.incidentCount++;
    }

    this.updatedAt = new Date();
    this.version++;
  }

  getExpiringCertifications(daysAhead: number = 30): VendorCertification[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    return this.certifications.filter(
      (cert) =>
        cert.isActive &&
        cert.expirationDate <= cutoffDate &&
        cert.expirationDate >= today, // Include certifications expiring today or later
    );
  }

  // Private helper methods
  private validateBusinessRules(
    vendorCode: string,
    vendorName: string,
    vendorType: VendorType,
    billingAddress: VendorAddress,
  ): void {
    if (!vendorCode || vendorCode.trim().length === 0) {
      throw new Error('Vendor code is required');
    }
    if (vendorCode.trim().length < 3 || vendorCode.trim().length > 20) {
      throw new Error('Vendor code must be between 3 and 20 characters');
    }
    if (!vendorName || vendorName.trim().length === 0) {
      throw new Error('Vendor name is required');
    }
    if (!Object.values(VendorType).includes(vendorType)) {
      throw new Error('Invalid vendor type');
    }

    // Validate address completeness
    if (!billingAddress.city || billingAddress.city.trim().length === 0) {
      throw new Error('Address city is required');
    }
    if (!billingAddress.state || billingAddress.state.trim().length === 0) {
      throw new Error('Address state is required');
    }
    if (!billingAddress.street || billingAddress.street.trim().length === 0) {
      throw new Error('Address street is required');
    }
  }

  private canTransitionTo(newStatus: VendorStatus): boolean {
    const validTransitions: Record<VendorStatus, VendorStatus[]> = {
      [VendorStatus.PENDING]: [
        VendorStatus.UNDER_REVIEW,
        VendorStatus.REJECTED,
      ],
      [VendorStatus.UNDER_REVIEW]: [
        VendorStatus.PREQUALIFIED,
        VendorStatus.APPROVED,
        VendorStatus.REJECTED,
      ],
      [VendorStatus.PREQUALIFIED]: [
        VendorStatus.APPROVED,
        VendorStatus.SUSPENDED,
        VendorStatus.REJECTED,
      ],
      [VendorStatus.APPROVED]: [VendorStatus.SUSPENDED, VendorStatus.INACTIVE],
      [VendorStatus.REJECTED]: [VendorStatus.PENDING], // Can reapply
      [VendorStatus.SUSPENDED]: [
        VendorStatus.PREQUALIFIED,
        VendorStatus.APPROVED,
        VendorStatus.REJECTED,
      ],
      [VendorStatus.INACTIVE]: [VendorStatus.PENDING], // Can reactivate
    };

    return validTransitions[this.status]?.includes(newStatus) || false;
  }

  private hasValidInsurance(): boolean {
    if (!this.insurance) return false;

    const now = new Date();
    return this.insurance.generalLiability.expirationDate > now;
  }

  private hasRequiredCertifications(): boolean {
    // Business rule: Service vendors must have safety certifications
    if (this.vendorType === VendorType.SERVICE) {
      return this.certifications.some(
        (cert) => cert.isActive && cert.expirationDate > new Date(),
      );
    }
    return true;
  }

  private validateInsurance(insurance: VendorInsurance): void {
    if (!insurance.generalLiability) {
      throw new Error('General liability insurance is required');
    }

    // Industry-specific minimum coverage requirements
    const minimumCoverage = this.getMinimumInsuranceCoverage();
    if (insurance.generalLiability.coverageAmount < minimumCoverage) {
      throw new Error(
        `General liability coverage must be at least $${minimumCoverage.toLocaleString()}`,
      );
    }

    // Allow insurance that expires within 30 days for renewal processing
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (insurance.generalLiability.expirationDate <= thirtyDaysFromNow) {
      // Don't throw error, but mark for renewal tracking
      console.warn(
        `Insurance expires soon: ${insurance.generalLiability.expirationDate.toISOString()}`,
      );
    }
  }

  private getMinimumInsuranceCoverage(): number {
    // Oil & gas industry minimum coverage by vendor type
    switch (this.vendorType) {
      case VendorType.SERVICE: // High-risk drilling, completion, workover
      case VendorType.CONTRACTOR: // General contractors
        return 5000000; // $5M for high-risk operations
      case VendorType.TRANSPORTATION:
      case VendorType.MAINTENANCE:
      case VendorType.ENVIRONMENTAL:
        return 2000000; // $2M for medium-risk operations
      case VendorType.SUPPLIER:
      case VendorType.CONSULTANT:
      case VendorType.LABORATORY:
        return 1000000; // $1M for lower-risk operations
      default:
        return 1000000; // Default minimum
    }
  }

  private validateCertification(certification: VendorCertification): void {
    if (!certification.name || !certification.certificationNumber) {
      throw new Error('Certification name and number are required');
    }
    if (certification.expirationDate <= new Date()) {
      throw new Error('Certification has expired');
    }
  }

  private checkForAutoApproval(): void {
    if (this.hasValidInsurance() && this.hasRequiredCertifications()) {
      this.isPrequalified = true;
      this.prequalificationDate = new Date();

      // Auto-prequalify if basic requirements are met
      if (
        this.status === VendorStatus.PENDING ||
        this.status === VendorStatus.UNDER_REVIEW
      ) {
        this.updateStatus(
          VendorStatus.PREQUALIFIED,
          'Auto-prequalified: Basic requirements met',
        );
      }
    }
  }

  private addDomainEvent(event: IEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): IEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}
