import { LeaseOperatingStatement } from '../entities/lease-operating-statement.entity';
import { StatementMonth } from '../value-objects/statement-month';
import { LosStatus } from '../enums/los-status.enum';

/**
 * Lease Operating Statement Repository Interface
 * Defines the contract for LOS data access operations
 * Following Repository pattern from DDD
 */
export interface ILosRepository {
  /**
   * Save a lease operating statement entity
   */
  save(los: LeaseOperatingStatement): Promise<LeaseOperatingStatement>;

  /**
   * Find LOS by ID
   */
  findById(id: string): Promise<LeaseOperatingStatement | null>;

  /**
   * Find LOS by organization ID
   */
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: LosStatus;
    },
  ): Promise<LeaseOperatingStatement[]>;

  /**
   * Find LOS by lease ID
   */
  findByLeaseId(
    leaseId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: LosStatus;
    },
  ): Promise<LeaseOperatingStatement[]>;

  /**
   * Find LOS by lease ID and statement month
   */
  findByLeaseIdAndMonth(
    leaseId: string,
    statementMonth: StatementMonth,
  ): Promise<LeaseOperatingStatement | null>;

  /**
   * Find LOS by status
   */
  findByStatus(
    organizationId: string,
    status: LosStatus,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<LeaseOperatingStatement[]>;

  /**
   * Find LOS by date range
   */
  findByDateRange(
    organizationId: string,
    startMonth: StatementMonth,
    endMonth: StatementMonth,
    options?: {
      leaseId?: string;
      status?: LosStatus;
      limit?: number;
      offset?: number;
    },
  ): Promise<LeaseOperatingStatement[]>;

  /**
   * Find draft LOS that need attention
   */
  findDraftStatements(
    organizationId: string,
    olderThanDays?: number,
  ): Promise<LeaseOperatingStatement[]>;

  /**
   * Find finalized LOS ready for distribution
   */
  findReadyForDistribution(
    organizationId: string,
  ): Promise<LeaseOperatingStatement[]>;

  /**
   * Check if LOS exists for lease and month
   */
  existsByLeaseIdAndMonth(
    leaseId: string,
    statementMonth: StatementMonth,
  ): Promise<boolean>;

  /**
   * Get total expense summary by lease for a date range
   */
  getExpenseSummaryByLease(
    organizationId: string,
    startMonth: StatementMonth,
    endMonth: StatementMonth,
  ): Promise<
    {
      leaseId: string;
      totalOperatingExpenses: number;
      totalCapitalExpenses: number;
      totalExpenses: number;
      statementCount: number;
    }[]
  >;

  /**
   * Get expense trends for organization
   */
  getExpenseTrends(
    organizationId: string,
    months: number,
  ): Promise<
    {
      month: string;
      totalOperatingExpenses: number;
      totalCapitalExpenses: number;
      totalExpenses: number;
      statementCount: number;
    }[]
  >;

  /**
   * Delete LOS by ID (only if in draft status)
   */
  delete(id: string): Promise<void>;

  /**
   * Count LOS by status for organization
   */
  countByStatus(organizationId: string): Promise<{
    draft: number;
    finalized: number;
    distributed: number;
    archived: number;
  }>;
}

/**
 * Data Transfer Objects for LOS operations
 */
export interface CreateLosDto {
  organizationId: string;
  leaseId: string;
  statementMonth: StatementMonth;
  notes?: string;
}

export interface UpdateLosDto {
  notes?: string;
}

export interface AddExpenseDto {
  description: string;
  category: string;
  type: string;
  amount: number;
  currency?: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  notes?: string;
}

export interface LosRecord {
  id: string;
  organizationId: string;
  leaseId: string;
  statementMonth: string;
  totalExpenses: string | null;
  operatingExpenses: string | null;
  capitalExpenses: string | null;
  status: LosStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  expenseBreakdown: any;
}

export interface LosListItem {
  id: string;
  leaseId: string;
  leaseName?: string;
  statementMonth: string;
  totalExpenses: number;
  operatingExpenses: number;
  capitalExpenses: number;
  status: LosStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LosExpenseSummary {
  leaseId: string;
  leaseName?: string;
  totalOperatingExpenses: number;
  totalCapitalExpenses: number;
  totalExpenses: number;
  statementCount: number;
}

export interface LosExpenseTrend {
  month: string;
  totalOperatingExpenses: number;
  totalCapitalExpenses: number;
  totalExpenses: number;
  statementCount: number;
}
