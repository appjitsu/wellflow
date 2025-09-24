import { Vendor } from '../entities/vendor.entity';
import {
  VendorStatus,
  VendorType,
  VendorRating,
} from '../enums/vendor-status.enum';

/**
 * Vendor Repository Interface
 * Defines the contract for vendor data access operations
 * Following Repository pattern and DDD principles
 */
export interface VendorRepository {
  /**
   * Save a vendor (create or update)
   */
  save(vendor: Vendor): Promise<Vendor>;

  /**
   * Find vendor by ID
   */
  findById(id: string): Promise<Vendor | null>;

  /**
   * Find vendor by vendor code within organization
   */
  findByVendorCode(
    organizationId: string,
    vendorCode: string,
  ): Promise<Vendor | null>;

  /**
   * Find all vendors for an organization
   */
  findByOrganization(
    organizationId: string,
    filters?: VendorFilters,
    pagination?: PaginationOptions,
  ): Promise<VendorSearchResult>;

  /**
   * Find vendors by status
   */
  findByStatus(
    organizationId: string,
    status: VendorStatus,
    pagination?: PaginationOptions,
  ): Promise<VendorSearchResult>;

  /**
   * Find vendors by type
   */
  findByType(
    organizationId: string,
    vendorType: VendorType,
    pagination?: PaginationOptions,
  ): Promise<VendorSearchResult>;

  /**
   * Find vendors with expiring insurance
   */
  findWithExpiringInsurance(
    organizationId: string,
    daysUntilExpiration: number,
  ): Promise<Vendor[]>;

  /**
   * Find vendors with expiring certifications
   */
  findWithExpiringCertifications(
    organizationId: string,
    daysUntilExpiration: number,
  ): Promise<Vendor[]>;

  /**
   * Find vendors by performance rating
   */
  findByPerformanceRating(
    organizationId: string,
    rating: VendorRating,
    pagination?: PaginationOptions,
  ): Promise<VendorSearchResult>;

  /**
   * Search vendors by name or code
   */
  search(
    organizationId: string,
    searchTerm: string,
    filters?: VendorFilters,
    pagination?: PaginationOptions,
  ): Promise<VendorSearchResult>;

  /**
   * Check if vendor code exists in organization
   */
  existsByVendorCode(
    organizationId: string,
    vendorCode: string,
  ): Promise<boolean>;

  /**
   * Delete vendor by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get vendor statistics for organization
   */
  getVendorStatistics(organizationId: string): Promise<VendorStatistics>;

  /**
   * Find vendors requiring qualification renewal
   */
  findRequiringQualificationRenewal(organizationId: string): Promise<Vendor[]>;

  /**
   * Find vendors with expiring qualifications (insurance or certifications)
   */
  findWithExpiringQualifications(
    organizationId: string,
    daysUntilExpiration: number,
  ): Promise<Vendor[]>;

  /**
   * Bulk update vendor statuses
   */
  bulkUpdateStatus(
    vendorIds: string[],
    status: VendorStatus,
    reason?: string,
  ): Promise<void>;
}

/**
 * Vendor search filters
 */
export interface VendorFilters {
  status?: VendorStatus[];
  vendorType?: VendorType[];
  isPrequalified?: boolean;
  hasValidInsurance?: boolean;
  performanceRating?: VendorRating[];
  serviceCategories?: string[];
  searchTerm?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  lastEvaluatedAfter?: Date;
  lastEvaluatedBefore?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Vendor search result with pagination
 */
export interface VendorSearchResult {
  vendors: Vendor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Vendor statistics for dashboard
 */
export interface VendorStatistics {
  totalVendors: number;
  activeVendors: number;
  pendingApproval: number;
  suspendedVendors: number;
  vendorsByType: Record<VendorType, number>;
  vendorsByRating: Record<VendorRating, number>;
  expiringInsurance: number;
  expiringCertifications: number;
  averagePerformanceRating: number;
  recentlyAdded: number; // Added in last 30 days
  qualifiedVendors: number;
}

/**
 * Vendor performance summary
 */
export interface VendorPerformanceSummary {
  vendorId: string;
  vendorName: string;
  overallRating: VendorRating;
  totalJobsCompleted: number;
  averageJobValue: number;
  safetyIncidents: number;
  onTimePerformance: number; // Percentage
  costVariance: number; // Percentage over/under budget
  lastEvaluationDate: Date;
  recommendedForRenewal: boolean;
}

/**
 * Vendor qualification status
 */
export interface VendorQualificationSummary {
  vendorId: string;
  vendorName: string;
  isQualified: boolean;
  insuranceStatus: 'valid' | 'expiring' | 'expired';
  certificationsStatus: 'valid' | 'expiring' | 'expired';
  qualificationExpiryDate?: Date;
  requiredActions: string[];
}
