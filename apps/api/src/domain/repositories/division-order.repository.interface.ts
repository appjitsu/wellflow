import { DivisionOrder } from '../entities/division-order.entity';
import { DecimalInterest } from '../value-objects/decimal-interest';

/**
 * Division Order Repository Interface
 * Defines the contract for division order data access operations
 * Following Repository pattern from DDD
 */
export interface IDivisionOrderRepository {
  /**
   * Save a division order entity
   */
  save(divisionOrder: DivisionOrder): Promise<DivisionOrder>;

  /**
   * Find division order by ID
   */
  findById(id: string): Promise<DivisionOrder | null>;

  /**
   * Find division orders by organization ID
   */
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    },
  ): Promise<DivisionOrder[]>;

  /**
   * Find division orders by well ID
   */
  findByWellId(wellId: string): Promise<DivisionOrder[]>;

  /**
   * Find active division orders by well ID
   */
  findActiveByWellId(wellId: string): Promise<DivisionOrder[]>;

  /**
   * Find division orders by partner ID
   */
  findByPartnerId(partnerId: string): Promise<DivisionOrder[]>;

  /**
   * Find active division orders by partner ID
   */
  findActiveByPartnerId(partnerId: string): Promise<DivisionOrder[]>;

  /**
   * Find division order by well and partner combination
   */
  findByWellAndPartner(
    wellId: string,
    partnerId: string,
    options?: {
      isActive?: boolean;
      effectiveDate?: Date;
    },
  ): Promise<DivisionOrder[]>;

  /**
   * Find active division order for a specific well and partner
   */
  findActiveByWellAndPartner(
    wellId: string,
    partnerId: string,
  ): Promise<DivisionOrder | null>;

  /**
   * Find division orders effective on a specific date
   */
  findEffectiveOn(
    wellId: string,
    effectiveDate: Date,
  ): Promise<DivisionOrder[]>;

  /**
   * Find division orders by date range
   */
  findByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<DivisionOrder[]>;

  /**
   * Find overlapping division orders for validation
   */
  findOverlapping(
    wellId: string,
    partnerId: string,
    effectiveDate: Date,
    endDate?: Date,
    excludeId?: string,
  ): Promise<DivisionOrder[]>;

  /**
   * Validate decimal interest totals for a well
   */
  validateDecimalInterestTotals(
    wellId: string,
    effectiveDate: Date,
  ): Promise<{
    isValid: boolean;
    totalInterest: DecimalInterest;
    divisionOrders: DivisionOrder[];
  }>;

  /**
   * Get decimal interest summary for a well
   */
  getDecimalInterestSummary(
    wellId: string,
    effectiveDate?: Date,
  ): Promise<{
    totalInterest: DecimalInterest;
    partnerInterests: Array<{
      partnerId: string;
      decimalInterest: DecimalInterest;
      divisionOrderId: string;
    }>;
  }>;

  /**
   * Find division orders requiring attention (validation issues)
   */
  findRequiringAttention(organizationId: string): Promise<
    Array<{
      wellId: string;
      issue: 'total_not_100_percent' | 'overlapping_orders' | 'missing_orders';
      divisionOrders: DivisionOrder[];
      totalInterest?: DecimalInterest;
    }>
  >;

  /**
   * Find division orders expiring soon
   */
  findExpiringSoon(
    organizationId: string,
    daysAhead: number = 30,
  ): Promise<DivisionOrder[]>;

  /**
   * Count division orders by criteria
   */
  count(criteria: {
    organizationId?: string;
    wellId?: string;
    partnerId?: string;
    isActive?: boolean;
    effectiveDateFrom?: Date;
    effectiveDateTo?: Date;
  }): Promise<number>;

  /**
   * Check if division order exists with specific criteria
   */
  exists(criteria: {
    wellId: string;
    partnerId: string;
    effectiveDate: Date;
    excludeId?: string;
  }): Promise<boolean>;

  /**
   * Delete division order by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Bulk update division orders (for administrative operations)
   */
  bulkUpdate(
    criteria: {
      organizationId?: string;
      wellId?: string;
      partnerId?: string;
    },
    updates: {
      isActive?: boolean;
      endDate?: Date;
    },
  ): Promise<number>;

  /**
   * Get division order history for audit purposes
   */
  getHistory(wellId: string, partnerId: string): Promise<DivisionOrder[]>;

  /**
   * Find division orders with specific decimal interest
   */
  findByDecimalInterest(
    organizationId: string,
    decimalInterest: DecimalInterest,
    tolerance?: number,
  ): Promise<DivisionOrder[]>;

  /**
   * Get statistics for division orders
   */
  getStatistics(organizationId: string): Promise<{
    totalDivisionOrders: number;
    activeDivisionOrders: number;
    wellsWithDivisionOrders: number;
    partnersWithDivisionOrders: number;
    averageDecimalInterest: number;
    wellsWithValidTotals: number;
    wellsWithInvalidTotals: number;
  }>;
}
