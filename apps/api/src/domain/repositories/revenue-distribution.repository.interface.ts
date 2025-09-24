import { RevenueDistribution } from '../entities/revenue-distribution.entity';
import { ProductionMonth } from '../value-objects/production-month';
import { Money } from '../value-objects/money';

/**
 * Revenue Distribution Repository Interface
 * Defines the contract for revenue distribution data access operations
 * Following Repository pattern from DDD
 */
export interface IRevenueDistributionRepository {
  /**
   * Save a revenue distribution entity
   */
  save(revenueDistribution: RevenueDistribution): Promise<RevenueDistribution>;

  /**
   * Find revenue distribution by ID
   */
  findById(id: string): Promise<RevenueDistribution | null>;

  /**
   * Find revenue distributions by organization ID
   */
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      productionMonth?: ProductionMonth;
      isPaid?: boolean;
    },
  ): Promise<RevenueDistribution[]>;

  /**
   * Find revenue distributions by well ID
   */
  findByWellId(
    wellId: string,
    options?: {
      productionMonth?: ProductionMonth;
      startMonth?: ProductionMonth;
      endMonth?: ProductionMonth;
    },
  ): Promise<RevenueDistribution[]>;

  /**
   * Find revenue distributions by partner ID
   */
  findByPartnerId(
    partnerId: string,
    options?: {
      productionMonth?: ProductionMonth;
      startMonth?: ProductionMonth;
      endMonth?: ProductionMonth;
      isPaid?: boolean;
    },
  ): Promise<RevenueDistribution[]>;

  /**
   * Find revenue distribution by well, partner, and production month
   */
  findByWellPartnerAndMonth(
    wellId: string,
    partnerId: string,
    productionMonth: ProductionMonth,
  ): Promise<RevenueDistribution | null>;

  /**
   * Find revenue distributions by division order ID
   */
  findByDivisionOrderId(
    divisionOrderId: string,
  ): Promise<RevenueDistribution[]>;

  /**
   * Find revenue distributions by production month
   */
  findByProductionMonth(
    organizationId: string,
    productionMonth: ProductionMonth,
  ): Promise<RevenueDistribution[]>;

  /**
   * Find revenue distributions by date range
   */
  findByDateRange(
    organizationId: string,
    startMonth: ProductionMonth,
    endMonth: ProductionMonth,
  ): Promise<RevenueDistribution[]>;

  /**
   * Find unpaid revenue distributions
   */
  findUnpaid(
    organizationId: string,
    options?: {
      wellId?: string;
      partnerId?: string;
      beforeMonth?: ProductionMonth;
    },
  ): Promise<RevenueDistribution[]>;

  /**
   * Find paid revenue distributions
   */
  findPaid(
    organizationId: string,
    options?: {
      wellId?: string;
      partnerId?: string;
      paymentDateFrom?: Date;
      paymentDateTo?: Date;
    },
  ): Promise<RevenueDistribution[]>;

  /**
   * Find revenue distributions by check number
   */
  findByCheckNumber(checkNumber: string): Promise<RevenueDistribution[]>;

  /**
   * Find revenue distributions requiring payment
   */
  findRequiringPayment(
    organizationId: string,
    minimumAmount?: Money,
  ): Promise<RevenueDistribution[]>;

  /**
   * Get revenue summary for a well
   */
  getWellRevenueSummary(
    wellId: string,
    options?: {
      startMonth?: ProductionMonth;
      endMonth?: ProductionMonth;
    },
  ): Promise<{
    totalRevenue: Money;
    totalDeductions: Money;
    netRevenue: Money;
    distributionCount: number;
    paidCount: number;
    unpaidCount: number;
  }>;

  /**
   * Get revenue summary for a partner
   */
  getPartnerRevenueSummary(
    partnerId: string,
    options?: {
      startMonth?: ProductionMonth;
      endMonth?: ProductionMonth;
    },
  ): Promise<{
    totalRevenue: Money;
    totalDeductions: Money;
    netRevenue: Money;
    distributionCount: number;
    paidCount: number;
    unpaidCount: number;
    wellCount: number;
  }>;

  /**
   * Get monthly revenue summary for organization
   */
  getMonthlyRevenueSummary(
    organizationId: string,
    productionMonth: ProductionMonth,
  ): Promise<{
    totalRevenue: Money;
    totalDeductions: Money;
    netRevenue: Money;
    distributionCount: number;
    partnerCount: number;
    wellCount: number;
    paidAmount: Money;
    unpaidAmount: Money;
  }>;

  /**
   * Get revenue trends over time
   */
  getRevenueTrends(
    organizationId: string,
    startMonth: ProductionMonth,
    endMonth: ProductionMonth,
  ): Promise<
    Array<{
      productionMonth: ProductionMonth;
      totalRevenue: Money;
      netRevenue: Money;
      distributionCount: number;
    }>
  >;

  /**
   * Find revenue distributions with calculation errors
   */
  findWithCalculationErrors(organizationId: string): Promise<
    Array<{
      revenueDistribution: RevenueDistribution;
      errorType:
        | 'negative_net_revenue'
        | 'excessive_deductions'
        | 'zero_production';
      errorMessage: string;
    }>
  >;

  /**
   * Count revenue distributions by criteria
   */
  count(criteria: {
    organizationId?: string;
    wellId?: string;
    partnerId?: string;
    productionMonth?: ProductionMonth;
    isPaid?: boolean;
    startMonth?: ProductionMonth;
    endMonth?: ProductionMonth;
  }): Promise<number>;

  /**
   * Check if revenue distribution exists
   */
  exists(criteria: {
    wellId: string;
    partnerId: string;
    productionMonth: ProductionMonth;
    excludeId?: string;
  }): Promise<boolean>;

  /**
   * Delete revenue distribution by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Bulk update revenue distributions
   */
  bulkUpdate(
    criteria: {
      organizationId?: string;
      wellId?: string;
      partnerId?: string;
      productionMonth?: ProductionMonth;
      isPaid?: boolean;
    },
    updates: {
      checkNumber?: string;
      paymentDate?: Date;
    },
  ): Promise<number>;

  /**
   * Get payment statistics
   */
  getPaymentStatistics(
    organizationId: string,
    options?: {
      startMonth?: ProductionMonth;
      endMonth?: ProductionMonth;
    },
  ): Promise<{
    totalDistributions: number;
    paidDistributions: number;
    unpaidDistributions: number;
    totalPaidAmount: Money;
    totalUnpaidAmount: Money;
    averagePaymentTime: number; // days
    oldestUnpaidMonth: ProductionMonth | null;
  }>;

  /**
   * Find duplicate revenue distributions
   */
  findDuplicates(organizationId: string): Promise<
    Array<{
      wellId: string;
      partnerId: string;
      productionMonth: ProductionMonth;
      duplicates: RevenueDistribution[];
    }>
  >;

  /**
   * Get revenue distribution history for audit
   */
  getAuditHistory(
    wellId: string,
    partnerId: string,
    productionMonth: ProductionMonth,
  ): Promise<RevenueDistribution[]>;
}
