import { Inject, Injectable } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, sql, desc, asc, lt, or } from 'drizzle-orm';
import type { HSEIncidentRepository } from '../../domain/repositories/hse-incident.repository';
import { HSEIncident } from '../../domain/entities/hse-incident.entity';
import { IncidentType } from '../../domain/value-objects/incident-type.vo';
import { IncidentSeverity } from '../../domain/value-objects/incident-severity.vo';
import { hseIncidents as hseIncidentsTable } from '../../database/schemas/hse-incidents';
import type * as schema from '../../database/schema';

/**
 * Drizzle-based HSE Incident Repository Implementation
 * Implements the HSEIncidentRepository interface using Drizzle ORM
 */
@Injectable()
export class HSEIncidentRepositoryImpl implements HSEIncidentRepository {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Save an HSE incident to the repository
   */
  async save(incident: HSEIncident): Promise<void> {
    const data = {
      id: incident.id,
      organizationId: incident.organizationId,
      wellId: incident.wellId,
      incidentNumber: incident.incidentNumber,
      incidentType: incident.incidentType.value,
      severity: incident.severity.value,
      incidentDate: incident.incidentDate,
      discoveryDate: incident.discoveryDate,
      location: incident.location,
      facilityId: incident.facilityId,
      description: incident.description,
      reportedByUserId: incident.reportedByUserId,
      affectedPersonnel: incident.affectedPersonnel,
      rootCauseAnalysis: incident.rootCauseAnalysis,
      contributingFactors: incident.contributingFactors,
      environmentalImpact: incident.environmentalImpact,
      propertyDamage: incident.propertyDamage?.toString(),
      estimatedCost: incident.estimatedCost?.toString(),
      reportableAgencies: incident.reportableAgencies,
      regulatoryNotificationRequired: incident.regulatoryNotificationRequired,
      notificationDeadline: incident.notificationDeadline
        ?.toISOString()
        .split('T')[0],
      investigationStatus: incident.investigationStatus,
      investigationLeadUserId: incident.investigationLeadUserId,
      investigationStartDate: incident.investigationStartDate
        ?.toISOString()
        .split('T')[0],
      investigationCompletionDate: incident.investigationCompletionDate
        ?.toISOString()
        .split('T')[0],
      correctiveActions: null, // Not used in entity
      status: incident.status,
      closureDate: incident.closureDate?.toISOString().split('T')[0],
      lessonsLearned: incident.lessonsLearned,
      createdAt: incident.createdAt,
      updatedAt: incident.updatedAt,
    };

    await this.db
      .insert(hseIncidentsTable)
      .values(data)
      .onConflictDoUpdate({
        target: hseIncidentsTable.id,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Save multiple HSE incidents within a unit of work
   */
  async saveMany(incidents: HSEIncident[]): Promise<void> {
    for (const incident of incidents) {
      await this.save(incident);
    }
  }

  /**
   * Find an HSE incident by its ID
   */
  async findById(id: string): Promise<HSEIncident | null> {
    const result = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(eq(hseIncidentsTable.id, id))
      .limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  /**
   * Find an HSE incident by incident number
   */
  async findByIncidentNumber(
    incidentNumber: string,
  ): Promise<HSEIncident | null> {
    const result = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(eq(hseIncidentsTable.incidentNumber, incidentNumber))
      .limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  /**
   * Find all HSE incidents for an organization
   */
  async findByOrganizationId(
    organizationId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      severity?: string;
      incidentType?: string;
      investigationStatus?: string;
    },
  ): Promise<HSEIncident[]> {
    const conditions = [eq(hseIncidentsTable.organizationId, organizationId)];

    if (options?.status) {
      conditions.push(eq(hseIncidentsTable.status, options.status));
    }

    if (options?.severity) {
      conditions.push(eq(hseIncidentsTable.severity, options.severity));
    }

    if (options?.incidentType) {
      conditions.push(eq(hseIncidentsTable.incidentType, options.incidentType));
    }

    if (options?.investigationStatus) {
      conditions.push(
        eq(hseIncidentsTable.investigationStatus, options.investigationStatus),
      );
    }

    const results = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(and(...conditions))
      .orderBy(desc(hseIncidentsTable.incidentDate))
      .offset(options?.offset || 0)
      .limit(options?.limit || 1000);
    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find HSE incidents associated with a well
   */
  async findByWellId(wellId: string): Promise<HSEIncident[]> {
    const results = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(eq(hseIncidentsTable.wellId, wellId))
      .orderBy(desc(hseIncidentsTable.incidentDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find HSE incidents that require immediate notification
   */
  async findIncidentsRequiringImmediateNotification(
    organizationId?: string,
  ): Promise<HSEIncident[]> {
    const conditions = [
      eq(hseIncidentsTable.regulatoryNotificationRequired, true),
      or(
        eq(hseIncidentsTable.status, 'open'),
        eq(hseIncidentsTable.status, 'investigating'),
      ),
    ];

    if (organizationId) {
      conditions.push(eq(hseIncidentsTable.organizationId, organizationId));
    }

    const results = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(and(...conditions))
      .orderBy(desc(hseIncidentsTable.incidentDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find HSE incidents that are overdue for regulatory notification
   */
  async findOverdueRegulatoryNotifications(
    organizationId?: string,
  ): Promise<HSEIncident[]> {
    const today = new Date().toISOString().substring(0, 10);

    const conditions = [
      eq(hseIncidentsTable.regulatoryNotificationRequired, true),
      lt(hseIncidentsTable.notificationDeadline, today),
      or(
        eq(hseIncidentsTable.status, 'open'),
        eq(hseIncidentsTable.status, 'investigating'),
      ),
    ];

    if (organizationId) {
      conditions.push(eq(hseIncidentsTable.organizationId, organizationId));
    }

    const results = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(and(...conditions))
      .orderBy(asc(hseIncidentsTable.notificationDeadline));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find HSE incidents by severity level
   */
  async findBySeverity(
    severity: string,
    organizationId?: string,
  ): Promise<HSEIncident[]> {
    const conditions = [eq(hseIncidentsTable.severity, severity)];

    if (organizationId) {
      conditions.push(eq(hseIncidentsTable.organizationId, organizationId));
    }

    const results = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(and(...conditions))
      .orderBy(desc(hseIncidentsTable.incidentDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find HSE incidents by incident type
   */
  async findByIncidentType(
    incidentType: string,
    organizationId?: string,
  ): Promise<HSEIncident[]> {
    const conditions = [eq(hseIncidentsTable.incidentType, incidentType)];

    if (organizationId) {
      conditions.push(eq(hseIncidentsTable.organizationId, organizationId));
    }

    const results = await this.db
      .select()
      .from(hseIncidentsTable)
      .where(and(...conditions))
      .orderBy(desc(hseIncidentsTable.incidentDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Count HSE incidents by status for an organization
   */
  async countByStatus(organizationId: string): Promise<Record<string, number>> {
    const results = await this.db
      .select({
        status: hseIncidentsTable.status,
        count: sql<number>`count(*)`,
      })
      .from(hseIncidentsTable)
      .where(eq(hseIncidentsTable.organizationId, organizationId))
      .groupBy(hseIncidentsTable.status);

    const statusCounts: Record<string, number> = {};
    for (const result of results) {
      statusCounts[result.status] = result.count;
    }

    return statusCounts;
  }

  /**
   * Count HSE incidents by severity for an organization
   */
  async countBySeverity(
    organizationId: string,
  ): Promise<Record<string, number>> {
    const results = await this.db
      .select({
        severity: hseIncidentsTable.severity,
        count: sql<number>`count(*)`,
      })
      .from(hseIncidentsTable)
      .where(eq(hseIncidentsTable.organizationId, organizationId))
      .groupBy(hseIncidentsTable.severity);

    const severityCounts: Record<string, number> = {};
    for (const result of results) {
      severityCounts[result.severity] = result.count;
    }

    return severityCounts;
  }

  /**
   * Delete an HSE incident by ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(hseIncidentsTable).where(eq(hseIncidentsTable.id, id));
  }

  /**
   * Check if an incident number already exists
   */
  async existsByIncidentNumber(
    incidentNumber: string,
    excludeId?: string,
  ): Promise<boolean> {
    const conditions = [eq(hseIncidentsTable.incidentNumber, incidentNumber)];

    if (excludeId) {
      conditions.push(sql`${hseIncidentsTable.id} != ${excludeId}`);
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(hseIncidentsTable)
      .where(and(...conditions))
      .limit(1);

    return (result[0]?.count ?? 0) > 0;
  }

  /**
   * Map database row to domain entity
   */
  private mapToDomain(row: typeof hseIncidentsTable.$inferSelect): HSEIncident {
    // Create incident with required constructor parameters
    const incident = new HSEIncident(
      row.id,
      row.incidentNumber,
      IncidentType.fromString(row.incidentType),
      IncidentSeverity.fromString(row.severity),
      row.organizationId,
      row.incidentDate,
      row.location,
      row.description,
      row.reportedByUserId,
    );

    // Set optional properties
    incident.wellId = row.wellId ?? undefined;
    incident.discoveryDate = row.discoveryDate ?? undefined;
    incident.facilityId = row.facilityId ?? undefined;
    incident.affectedPersonnel =
      (row.affectedPersonnel as Record<string, unknown>[]) ?? undefined;
    incident.rootCauseAnalysis =
      (row.rootCauseAnalysis as Record<string, unknown>) ?? undefined;
    incident.contributingFactors =
      (row.contributingFactors as Record<string, unknown>[]) ?? undefined;
    incident.environmentalImpact =
      (row.environmentalImpact as Record<string, unknown>) ?? undefined;
    incident.propertyDamage = row.propertyDamage
      ? parseFloat(row.propertyDamage)
      : undefined;
    incident.estimatedCost = row.estimatedCost
      ? parseFloat(row.estimatedCost)
      : undefined;
    incident.reportableAgencies =
      (row.reportableAgencies as string[]) ?? undefined;
    incident.regulatoryNotificationRequired =
      row.regulatoryNotificationRequired || false;
    incident.notificationDeadline = row.notificationDeadline
      ? new Date(row.notificationDeadline)
      : undefined;
    incident.investigationStatus = row.investigationStatus;
    incident.investigationLeadUserId = row.investigationLeadUserId ?? undefined;
    incident.investigationStartDate = row.investigationStartDate
      ? new Date(row.investigationStartDate)
      : undefined;
    incident.investigationCompletionDate = row.investigationCompletionDate
      ? new Date(row.investigationCompletionDate)
      : undefined;

    incident.status = row.status;
    incident.closureDate = row.closureDate
      ? new Date(row.closureDate)
      : undefined;
    incident.lessonsLearned = row.lessonsLearned ?? undefined;
    incident.createdAt = row.createdAt;
    incident.updatedAt = row.updatedAt;

    return incident;
  }
}
