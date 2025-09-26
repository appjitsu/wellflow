import { IEvent } from '@nestjs/cqrs';
import { Money } from '../value-objects/money';
import { ProductionMonth } from '../value-objects/production-month';
import { RevenueDistributionCreatedEvent } from '../events/revenue-distribution-created.event';
import { RevenueDistributionCalculatedEvent } from '../events/revenue-distribution-calculated.event';
import { RevenueDistributionPaidEvent } from '../events/revenue-distribution-paid.event';

export interface ProductionVolumes {
  oilVolume?: number;
  gasVolume?: number;
}

export interface RevenueBreakdown {
  oilRevenue?: Money;
  gasRevenue?: Money;
  totalRevenue: Money;
  severanceTax?: Money;
  adValorem?: Money;
  transportationCosts?: Money;
  processingCosts?: Money;
  otherDeductions?: Money;
  netRevenue: Money;
}

export interface PaymentInfo {
  checkNumber?: string;
  paymentDate?: Date;
  paymentMethod?: 'check' | 'ach' | 'wire';
}

export interface RevenueDistributionPersistenceData {
  id: string;
  organizationId: string;
  wellId: string;
  partnerId: string;
  divisionOrderId: string;
  productionMonth: Date;
  oilVolume?: number;
  gasVolume?: number;
  oilRevenue?: number;
  gasRevenue?: number;
  totalRevenue: number;
  severanceTax?: number;
  adValorem?: number;
  transportationCosts?: number;
  processingCosts?: number;
  otherDeductions?: number;
  netRevenue: number;
  checkNumber?: string;
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Revenue Distribution Entity - Aggregate Root
 * Represents monthly revenue distribution to an interest owner
 *
 * Business Rules:
 * - Must be associated with an active division order
 * - Production month must be in the past
 * - Net revenue cannot exceed total revenue
 * - Payment can only be processed once
 * - All monetary amounts must use same currency
 */
export class RevenueDistribution {
  private id: string;
  private organizationId: string;
  private wellId: string;
  private partnerId: string;
  private divisionOrderId: string;
  private productionMonth: ProductionMonth;
  private productionVolumes: ProductionVolumes;
  private revenueBreakdown: RevenueBreakdown;
  private paymentInfo: PaymentInfo;
  private createdAt: Date;
  private updatedAt: Date;
  private version: number;

  // Domain events
  private domainEvents: IEvent[] = [];

  constructor(
    id: string,
    organizationId: string,
    wellId: string,
    partnerId: string,
    divisionOrderId: string,
    productionMonth: ProductionMonth,
    productionVolumes: ProductionVolumes,
    revenueBreakdown: RevenueBreakdown,
    paymentInfo?: PaymentInfo,
  ) {
    this.validateConstructorInputs(
      organizationId,
      wellId,
      partnerId,
      divisionOrderId,
      productionMonth,
      revenueBreakdown,
    );

    this.id = id;
    this.organizationId = organizationId;
    this.wellId = wellId;
    this.partnerId = partnerId;
    this.divisionOrderId = divisionOrderId;
    this.productionMonth = productionMonth;
    this.productionVolumes = { ...productionVolumes };
    this.revenueBreakdown = { ...revenueBreakdown };
    this.paymentInfo = paymentInfo
      ? {
          ...paymentInfo,
          paymentDate: paymentInfo.paymentDate
            ? new Date(paymentInfo.paymentDate.getTime())
            : undefined,
        }
      : {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.version = 1;

    // Raise domain event for revenue distribution creation
    this.addDomainEvent(
      new RevenueDistributionCreatedEvent(
        this.id,
        this.organizationId,
        this.wellId,
        this.partnerId,
        this.productionMonth.getFormattedString(),
        this.revenueBreakdown.netRevenue.getAmount(),
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

  getWellId(): string {
    return this.wellId;
  }

  getPartnerId(): string {
    return this.partnerId;
  }

  getDivisionOrderId(): string {
    return this.divisionOrderId;
  }

  getProductionMonth(): ProductionMonth {
    return this.productionMonth;
  }

  getProductionVolumes(): ProductionVolumes {
    return { ...this.productionVolumes };
  }

  getRevenueBreakdown(): RevenueBreakdown {
    return {
      ...this.revenueBreakdown,
      oilRevenue: this.revenueBreakdown.oilRevenue,
      gasRevenue: this.revenueBreakdown.gasRevenue,
      totalRevenue: this.revenueBreakdown.totalRevenue,
      severanceTax: this.revenueBreakdown.severanceTax,
      adValorem: this.revenueBreakdown.adValorem,
      transportationCosts: this.revenueBreakdown.transportationCosts,
      processingCosts: this.revenueBreakdown.processingCosts,
      otherDeductions: this.revenueBreakdown.otherDeductions,
      netRevenue: this.revenueBreakdown.netRevenue,
    };
  }

  getPaymentInfo(): PaymentInfo {
    return {
      ...this.paymentInfo,
      paymentDate: this.paymentInfo.paymentDate
        ? new Date(this.paymentInfo.paymentDate.getTime())
        : undefined,
    };
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  getVersion(): number {
    return this.version;
  }

  // Domain events management
  getDomainEvents(): IEvent[] {
    return [...this.domainEvents];
  }

  addDomainEvent(event: IEvent): void {
    this.domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Business methods
  recalculateRevenue(
    newProductionVolumes: ProductionVolumes,
    newRevenueBreakdown: RevenueBreakdown,
    calculatedBy: string,
  ): void {
    this.validateRevenueBreakdown(newRevenueBreakdown);

    if (this.isPaid()) {
      throw new Error(
        'Cannot recalculate revenue for already paid distribution',
      );
    }

    this.productionVolumes = { ...newProductionVolumes };
    this.revenueBreakdown = { ...newRevenueBreakdown };
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new RevenueDistributionCalculatedEvent(
        this.id,
        this.organizationId,
        this.wellId,
        this.partnerId,
        this.productionMonth.getFormattedString(),
        this.revenueBreakdown.netRevenue.getAmount(),
        calculatedBy,
      ),
    );
  }

  processPayment(
    checkNumber: string,
    paymentDate: Date,
    processedBy: string,
  ): void {
    if (this.isPaid()) {
      throw new Error('Revenue distribution has already been paid');
    }

    if (!checkNumber?.trim()) {
      throw new Error('Check number is required for payment processing');
    }

    if (paymentDate > new Date()) {
      throw new Error('Payment date cannot be in the future');
    }

    this.paymentInfo = {
      checkNumber: checkNumber.trim(),
      paymentDate: new Date(paymentDate),
      paymentMethod: 'check',
    };
    this.updatedAt = new Date();
    this.version++;

    this.addDomainEvent(
      new RevenueDistributionPaidEvent(
        this.id,
        this.organizationId,
        this.wellId,
        this.partnerId,
        this.productionMonth.getFormattedString(),
        this.revenueBreakdown.netRevenue.getAmount(),
        checkNumber,
        paymentDate,
        processedBy,
      ),
    );
  }

  /**
   * Check if this distribution has been paid
   */
  isPaid(): boolean {
    return !!(this.paymentInfo.checkNumber && this.paymentInfo.paymentDate);
  }

  /**
   * Get the net revenue amount
   */
  getNetRevenueAmount(): Money {
    return this.revenueBreakdown.netRevenue;
  }

  /**
   * Get the total revenue amount
   */
  getTotalRevenueAmount(): Money {
    return this.revenueBreakdown.totalRevenue;
  }

  /**
   * Get total deductions
   */
  getTotalDeductions(): Money {
    const deductions = [
      this.revenueBreakdown.severanceTax,
      this.revenueBreakdown.adValorem,
      this.revenueBreakdown.transportationCosts,
      this.revenueBreakdown.processingCosts,
      this.revenueBreakdown.otherDeductions,
    ].filter(Boolean) as Money[];

    return deductions.reduce(
      (total, deduction) => total.add(deduction),
      new Money(0, this.revenueBreakdown.totalRevenue.getCurrency()),
    );
  }

  private validateConstructorInputs(
    organizationId: string,
    wellId: string,
    partnerId: string,
    divisionOrderId: string,
    productionMonth: ProductionMonth,
    revenueBreakdown: RevenueBreakdown,
  ): void {
    if (!organizationId?.trim()) {
      throw new Error('Organization ID is required');
    }

    if (!wellId?.trim()) {
      throw new Error('Well ID is required');
    }

    if (!partnerId?.trim()) {
      throw new Error('Partner ID is required');
    }

    if (!divisionOrderId?.trim()) {
      throw new Error('Division Order ID is required');
    }

    if (!productionMonth) {
      throw new Error('Production month is required');
    }

    if (productionMonth.isFutureMonth()) {
      throw new Error('Production month cannot be in the future');
    }

    this.validateRevenueBreakdown(revenueBreakdown);
  }

  private validateRevenueBreakdown(revenueBreakdown: RevenueBreakdown): void {
    if (!revenueBreakdown.totalRevenue) {
      throw new Error('Total revenue is required');
    }

    if (!revenueBreakdown.netRevenue) {
      throw new Error('Net revenue is required');
    }

    if (revenueBreakdown.totalRevenue.isNegative()) {
      throw new Error('Total revenue cannot be negative');
    }

    if (
      revenueBreakdown.netRevenue.isGreaterThan(revenueBreakdown.totalRevenue)
    ) {
      throw new Error('Net revenue cannot exceed total revenue');
    }

    // Validate currency consistency
    const currency = revenueBreakdown.totalRevenue.getCurrency();
    const amounts = [
      revenueBreakdown.oilRevenue,
      revenueBreakdown.gasRevenue,
      revenueBreakdown.netRevenue,
      revenueBreakdown.severanceTax,
      revenueBreakdown.adValorem,
      revenueBreakdown.transportationCosts,
      revenueBreakdown.processingCosts,
      revenueBreakdown.otherDeductions,
    ].filter(Boolean) as Money[];

    for (const amount of amounts) {
      if (amount.getCurrency() !== currency) {
        throw new Error('All revenue amounts must use the same currency');
      }
    }
  }

  // Factory methods
  static create(
    organizationId: string,
    wellId: string,
    partnerId: string,
    divisionOrderId: string,
    productionMonth: ProductionMonth,
    productionVolumes: ProductionVolumes,
    revenueBreakdown: RevenueBreakdown,
    options?: {
      id?: string;
      paymentInfo?: PaymentInfo;
    },
  ): RevenueDistribution {
    const id = options?.id || crypto.randomUUID();
    return new RevenueDistribution(
      id,
      organizationId,
      wellId,
      partnerId,
      divisionOrderId,
      productionMonth,
      productionVolumes,
      revenueBreakdown,
      options?.paymentInfo,
    );
  }

  // Factory method for persistence
  static fromPersistence(
    data: RevenueDistributionPersistenceData,
  ): RevenueDistribution {
    const productionMonth = ProductionMonth.fromDatabaseDate(
      data.productionMonth,
    );

    const productionVolumes: ProductionVolumes = {
      oilVolume: data.oilVolume,
      gasVolume: data.gasVolume,
    };

    const currency = 'USD'; // Default currency, could be configurable
    const revenueBreakdown: RevenueBreakdown = {
      oilRevenue: data.oilRevenue
        ? new Money(data.oilRevenue, currency)
        : undefined,
      gasRevenue: data.gasRevenue
        ? new Money(data.gasRevenue, currency)
        : undefined,
      totalRevenue: new Money(data.totalRevenue, currency),
      severanceTax: data.severanceTax
        ? new Money(data.severanceTax, currency)
        : undefined,
      adValorem: data.adValorem
        ? new Money(data.adValorem, currency)
        : undefined,
      transportationCosts: data.transportationCosts
        ? new Money(data.transportationCosts, currency)
        : undefined,
      processingCosts: data.processingCosts
        ? new Money(data.processingCosts, currency)
        : undefined,
      otherDeductions: data.otherDeductions
        ? new Money(data.otherDeductions, currency)
        : undefined,
      netRevenue: new Money(data.netRevenue, currency),
    };

    const paymentInfo: PaymentInfo = {
      checkNumber: data.checkNumber,
      paymentDate: data.paymentDate,
      paymentMethod: data.checkNumber ? 'check' : undefined,
    };

    const revenueDistribution = new RevenueDistribution(
      data.id,
      data.organizationId,
      data.wellId,
      data.partnerId,
      data.divisionOrderId,
      productionMonth,
      productionVolumes,
      revenueBreakdown,
      paymentInfo,
    );

    // Set persistence data
    revenueDistribution.createdAt = data.createdAt;
    revenueDistribution.updatedAt = data.updatedAt;
    revenueDistribution.version = data.version;

    // Clear creation event since this is from persistence
    revenueDistribution.clearDomainEvents();

    return revenueDistribution;
  }

  // Convert to persistence format
  toPersistence(): RevenueDistributionPersistenceData {
    return {
      id: this.id,
      organizationId: this.organizationId,
      wellId: this.wellId,
      partnerId: this.partnerId,
      divisionOrderId: this.divisionOrderId,
      productionMonth: this.productionMonth.toDatabaseDate(),
      oilVolume: this.productionVolumes.oilVolume,
      gasVolume: this.productionVolumes.gasVolume,
      oilRevenue: this.revenueBreakdown.oilRevenue?.getAmount(),
      gasRevenue: this.revenueBreakdown.gasRevenue?.getAmount(),
      totalRevenue: this.revenueBreakdown.totalRevenue.getAmount(),
      severanceTax: this.revenueBreakdown.severanceTax?.getAmount(),
      adValorem: this.revenueBreakdown.adValorem?.getAmount(),
      transportationCosts:
        this.revenueBreakdown.transportationCosts?.getAmount(),
      processingCosts: this.revenueBreakdown.processingCosts?.getAmount(),
      otherDeductions: this.revenueBreakdown.otherDeductions?.getAmount(),
      netRevenue: this.revenueBreakdown.netRevenue.getAmount(),
      checkNumber: this.paymentInfo.checkNumber,
      paymentDate: this.paymentInfo.paymentDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
    };
  }
}
