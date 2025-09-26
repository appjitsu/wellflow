import { EnvironmentalMonitoring } from '../entities/environmental-monitoring.entity';

/**
 * Repository interface for Environmental Monitoring aggregate
 * Defines the contract for environmental monitoring data access operations
 */
export interface EnvironmentalMonitoringRepository {
  /**
   * Save environmental monitoring data to the repository
   * @param monitoring The environmental monitoring aggregate to save
   */
  save(monitoring: EnvironmentalMonitoring): Promise<void>;

  /**
   * Save multiple environmental monitoring records within a unit of work
   * @param monitoringRecords Array of environmental monitoring records to save
   */
  saveMany(monitoringRecords: EnvironmentalMonitoring[]): Promise<void>;

  /**
   * Find environmental monitoring record by its ID
   * @param id The environmental monitoring record ID
   * @returns The environmental monitoring aggregate or null if not found
   */
  findById(id: string): Promise<EnvironmentalMonitoring | null>;

  /**
   * Find environmental monitoring record by monitoring point ID and parameter
   * @param monitoringPointId The monitoring point ID
   * @param parameter The monitoring parameter
   * @param monitoringDate The monitoring date
   * @returns The environmental monitoring aggregate or null if not found
   */
  findByMonitoringPointAndParameter(
    monitoringPointId: string,
    parameter: string,
    monitoringDate: Date,
  ): Promise<EnvironmentalMonitoring | null>;

  /**
   * Find all environmental monitoring records for an organization
   * @param organizationId The organization ID
   * @param options Query options for pagination and filtering
   * @returns Array of environmental monitoring records
   */
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      monitoringType?: string;
      parameter?: string;
      isCompliant?: boolean;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<EnvironmentalMonitoring[]>;

  /**
   * Find environmental monitoring records associated with a well
   * @param wellId The well ID
   * @returns Array of environmental monitoring records
   */
  findByWellId(wellId: string): Promise<EnvironmentalMonitoring[]>;

  /**
   * Find environmental monitoring records that exceed compliance limits
   * @param organizationId Optional organization filter
   * @returns Array of non-compliant monitoring records
   */
  findComplianceViolations(
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]>;

  /**
   * Find environmental monitoring records that are overdue for reporting
   * @param organizationId Optional organization filter
   * @returns Array of overdue monitoring records
   */
  findOverdueForReporting(
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]>;

  /**
   * Find environmental monitoring records requiring calibration
   * @param organizationId Optional organization filter
   * @returns Array of monitoring records requiring calibration
   */
  findRequiringCalibration(
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]>;

  /**
   * Find environmental monitoring records by monitoring type
   * @param monitoringType The monitoring type to filter by
   * @param organizationId Optional organization filter
   * @returns Array of monitoring records of the specified type
   */
  findByMonitoringType(
    monitoringType: string,
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]>;

  /**
   * Find environmental monitoring records by parameter
   * @param parameter The parameter to filter by
   * @param organizationId Optional organization filter
   * @returns Array of monitoring records for the specified parameter
   */
  findByParameter(
    parameter: string,
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]>;

  /**
   * Count environmental monitoring records by compliance status for an organization
   * @param organizationId The organization ID
   * @returns Object with compliance status counts
   */
  countByComplianceStatus(
    organizationId: string,
  ): Promise<Record<string, number>>;

  /**
   * Count environmental monitoring records by monitoring type for an organization
   * @param organizationId The organization ID
   * @returns Object with monitoring type counts
   */
  countByMonitoringType(
    organizationId: string,
  ): Promise<Record<string, number>>;

  /**
   * Delete an environmental monitoring record by ID
   * @param id The environmental monitoring record ID to delete
   */
  delete(id: string): Promise<void>;

  /**
   * Check if a monitoring record exists for the given point, parameter, and date
   * @param monitoringPointId The monitoring point ID
   * @param parameter The parameter
   * @param monitoringDate The monitoring date
   * @param excludeId Optional ID to exclude from check (for updates)
   * @returns True if record exists
   */
  existsByMonitoringPointParameterAndDate(
    monitoringPointId: string,
    parameter: string,
    monitoringDate: Date,
    excludeId?: string,
  ): Promise<boolean>;
}
