import { Afe } from '../entities/afe.entity';
import { AfeStatus, AfeType } from '../enums/afe-status.enum';

/**
 * AFE Repository Interface
 * Defines the contract for AFE data access operations
 * Following Repository pattern from DDD
 */
export interface IAfeRepository {
  /**
   * Save an AFE entity
   */
  save(afe: Afe): Promise<Afe>;

  /**
   * Find AFE by ID
   */
  findById(id: string): Promise<Afe | null>;

  /**
   * Find AFE by AFE number within organization
   */
  findByAfeNumber(
    organizationId: string,
    afeNumber: string,
  ): Promise<Afe | null>;

  /**
   * Find AFEs by organization ID
   */
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: AfeStatus;
      afeType?: AfeType;
    },
  ): Promise<Afe[]>;

  /**
   * Find AFEs by well ID
   */
  findByWellId(wellId: string): Promise<Afe[]>;

  /**
   * Find AFEs by lease ID
   */
  findByLeaseId(leaseId: string): Promise<Afe[]>;

  /**
   * Find AFEs by status
   */
  findByStatus(organizationId: string, status: AfeStatus): Promise<Afe[]>;

  /**
   * Find AFEs requiring approval
   */
  findRequiringApproval(organizationId: string): Promise<Afe[]>;

  /**
   * Find AFEs by date range
   */
  findByDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Afe[]>;

  /**
   * Get next AFE number for organization and year
   */
  getNextAfeNumber(organizationId: string, year: number): Promise<string>;

  /**
   * Check if AFE number exists within organization
   */
  existsByAfeNumber(
    organizationId: string,
    afeNumber: string,
  ): Promise<boolean>;

  /**
   * Delete AFE by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Count AFEs by criteria
   */
  count(
    organizationId: string,
    criteria?: {
      status?: AfeStatus;
      afeType?: AfeType;
      wellId?: string;
      leaseId?: string;
    },
  ): Promise<number>;
}
