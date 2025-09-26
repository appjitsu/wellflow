import { Permit } from '../entities/permit.entity';

/**
 * Repository interface for Permit aggregate
 * Defines the contract for permit data access operations
 */
export interface PermitRepository {
  /**
   * Save a permit to the repository
   * @param permit The permit aggregate to save
   */
  save(permit: Permit): Promise<void>;

  /**
   * Save multiple permits within a unit of work
   * @param permits Array of permits to save
   */
  saveMany(permits: Permit[]): Promise<void>;

  /**
   * Find a permit by its ID
   * @param id The permit ID
   * @returns The permit aggregate or null if not found
   */
  findById(id: string): Promise<Permit | null>;

  /**
   * Find a permit by permit number
   * @param permitNumber The permit number
   * @returns The permit aggregate or null if not found
   */
  findByPermitNumber(permitNumber: string): Promise<Permit | null>;

  /**
   * Find all permits for an organization
   * @param organizationId The organization ID
   * @param options Query options for pagination and filtering
   * @returns Array of permits
   */
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      permitType?: string;
    },
  ): Promise<Permit[]>;

  /**
   * Find permits associated with a well
   * @param wellId The well ID
   * @returns Array of permits
   */
  findByWellId(wellId: string): Promise<Permit[]>;

  /**
   * Find permits expiring within a specified number of days
   * @param days Number of days from now
   * @param organizationId Optional organization filter
   * @returns Array of expiring permits
   */
  findExpiringPermits(days: number, organizationId?: string): Promise<Permit[]>;

  /**
   * Find permits requiring renewal
   * @param organizationId Optional organization filter
   * @returns Array of permits requiring renewal
   */
  findPermitsRequiringRenewal(organizationId?: string): Promise<Permit[]>;

  /**
   * Count permits by status for an organization
   * @param organizationId The organization ID
   * @returns Object with status counts
   */
  countByStatus(organizationId: string): Promise<Record<string, number>>;

  /**
   * Delete a permit by ID
   * @param id The permit ID to delete
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a permit number already exists
   * @param permitNumber The permit number to check
   * @param excludeId Optional ID to exclude from check (for updates)
   * @returns True if permit number exists
   */
  existsByPermitNumber(
    permitNumber: string,
    excludeId?: string,
  ): Promise<boolean>;

  /**
   * Get permit statistics for an organization
   * @param organizationId The organization ID
   * @returns Statistics object with permit counts
   */
  getPermitStatistics(organizationId: string): Promise<{
    totalPermits: number;
    active: number;
    expired: number;
    expiringWithin30Days: number;
    pendingRenewal: number;
  }>;
}
