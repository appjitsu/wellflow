import { HSEIncident } from '../entities/hse-incident.entity';

/**
 * Repository interface for HSE Incident aggregate
 * Defines the contract for HSE incident data access operations
 */
export interface HSEIncidentRepository {
  /**
   * Save an HSE incident to the repository
   * @param incident The HSE incident aggregate to save
   */
  save(incident: HSEIncident): Promise<void>;

  /**
   * Save multiple HSE incidents within a unit of work
   * @param incidents Array of HSE incidents to save
   */
  saveMany(incidents: HSEIncident[]): Promise<void>;

  /**
   * Find an HSE incident by its ID
   * @param id The HSE incident ID
   * @returns The HSE incident aggregate or null if not found
   */
  findById(id: string): Promise<HSEIncident | null>;

  /**
   * Find an HSE incident by incident number
   * @param incidentNumber The incident number
   * @returns The HSE incident aggregate or null if not found
   */
  findByIncidentNumber(incidentNumber: string): Promise<HSEIncident | null>;

  /**
   * Find all HSE incidents for an organization
   * @param organizationId The organization ID
   * @param options Query options for pagination and filtering
   * @returns Array of HSE incidents
   */
  findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      severity?: string;
      incidentType?: string;
      investigationStatus?: string;
    },
  ): Promise<HSEIncident[]>;

  /**
   * Find HSE incidents associated with a well
   * @param wellId The well ID
   * @returns Array of HSE incidents
   */
  findByWellId(wellId: string): Promise<HSEIncident[]>;

  /**
   * Find HSE incidents that require immediate notification
   * @param organizationId Optional organization filter
   * @returns Array of high-priority incidents
   */
  findIncidentsRequiringImmediateNotification(
    organizationId?: string,
  ): Promise<HSEIncident[]>;

  /**
   * Find HSE incidents that are overdue for regulatory notification
   * @param organizationId Optional organization filter
   * @returns Array of overdue incidents
   */
  findOverdueRegulatoryNotifications(
    organizationId?: string,
  ): Promise<HSEIncident[]>;

  /**
   * Find HSE incidents by severity level
   * @param severity The severity level to filter by
   * @param organizationId Optional organization filter
   * @returns Array of incidents with the specified severity
   */
  findBySeverity(
    severity: string,
    organizationId?: string,
  ): Promise<HSEIncident[]>;

  /**
   * Find HSE incidents by incident type
   * @param incidentType The incident type to filter by
   * @param organizationId Optional organization filter
   * @returns Array of incidents of the specified type
   */
  findByIncidentType(
    incidentType: string,
    organizationId?: string,
  ): Promise<HSEIncident[]>;

  /**
   * Count HSE incidents by status for an organization
   * @param organizationId The organization ID
   * @returns Object with status counts
   */
  countByStatus(organizationId: string): Promise<Record<string, number>>;

  /**
   * Count HSE incidents by severity for an organization
   * @param organizationId The organization ID
   * @returns Object with severity counts
   */
  countBySeverity(organizationId: string): Promise<Record<string, number>>;

  /**
   * Delete an HSE incident by ID
   * @param id The HSE incident ID to delete
   */
  delete(id: string): Promise<void>;

  /**
   * Check if an incident number already exists
   * @param incidentNumber The incident number to check
   * @param excludeId Optional ID to exclude from check (for updates)
   * @returns True if incident number exists
   */
  existsByIncidentNumber(
    incidentNumber: string,
    excludeId?: string,
  ): Promise<boolean>;
}
