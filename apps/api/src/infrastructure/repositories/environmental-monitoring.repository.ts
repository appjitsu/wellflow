import { Injectable } from '@nestjs/common';
import { eq, and, sql, desc, asc, gte, lte, lt } from 'drizzle-orm';
import type { EnvironmentalMonitoringRepository } from '../../domain/repositories/environmental-monitoring.repository';
import { EnvironmentalMonitoring } from '../../domain/entities/environmental-monitoring.entity';
import { MonitoringType } from '../../domain/value-objects/monitoring-type.vo';
import { environmentalMonitoring as environmentalMonitoringTable } from '../../database/schemas/environmental-monitoring';
import { DatabaseService } from '../../database/database.service';

/**
 * Drizzle-based Environmental Monitoring Repository Implementation
 * Implements the EnvironmentalMonitoringRepository interface using Drizzle ORM
 */
@Injectable()
export class EnvironmentalMonitoringRepositoryImpl
  implements EnvironmentalMonitoringRepository
{
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Save environmental monitoring data to the repository
   */
  async save(monitoring: EnvironmentalMonitoring): Promise<void> {
    const data = {
      id: monitoring.id,
      organizationId: monitoring.organizationId,
      wellId: monitoring.wellId,
      monitoringPointId: monitoring.monitoringPointId,
      monitoringType: monitoring.monitoringType.value,
      monitoringCategory: null, // Not used in entity
      location: monitoring.location,
      facilityId: monitoring.facilityId,
      equipmentId: monitoring.equipmentId,
      parameter: monitoring.parameter,
      unitOfMeasure: monitoring.unitOfMeasure,
      monitoringDate: monitoring.monitoringDate,
      measuredValue: monitoring.measuredValue?.toString(),
      detectionLimit: monitoring.detectionLimit?.toString(),
      exceedanceThreshold: monitoring.exceedanceThreshold?.toString(),
      regulatoryStandard: monitoring.regulatoryStandard,
      complianceLimit: monitoring.complianceLimit?.toString(),
      isCompliant: monitoring.isCompliant,
      monitoringMethod: monitoring.monitoringMethod,
      equipmentType: monitoring.equipmentType,
      equipmentSerialNumber: monitoring.equipmentSerialNumber,
      calibrationDate: monitoring.calibrationDate?.toISOString().split('T')[0],
      nextCalibrationDate: monitoring.nextCalibrationDate
        ?.toISOString()
        .split('T')[0],
      qaQcPerformed: monitoring.qaQcPerformed,
      qaQcMethod: monitoring.qaQcMethod,
      dataQualityIndicator: monitoring.dataQualityIndicator,
      weatherConditions: monitoring.weatherConditions,
      operationalConditions: monitoring.operationalConditions,
      reportRequired: monitoring.reportRequired,
      reportingPeriod: monitoring.reportingPeriod,
      dueDate: monitoring.dueDate?.toISOString().split('T')[0],
      reportedDate: monitoring.reportedDate?.toISOString().split('T')[0],
      reportNumber: monitoring.reportNumber,
      correctiveActions: monitoring.correctiveActions,
      followUpRequired: monitoring.followUpRequired,
      followUpDate: monitoring.followUpDate?.toISOString().split('T')[0],
      monitoredByUserId: monitoring.monitoredByUserId,
      reviewedByUserId: monitoring.reviewedByUserId,
      createdAt: monitoring.createdAt,
      updatedAt: monitoring.updatedAt,
    };

    const db = this.databaseService.getDb();
    await db
      .insert(environmentalMonitoringTable)
      .values(data)
      .onConflictDoUpdate({
        target: environmentalMonitoringTable.id,
        set: {
          ...data,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Save multiple environmental monitoring records within a unit of work
   */
  async saveMany(monitoringRecords: EnvironmentalMonitoring[]): Promise<void> {
    for (const record of monitoringRecords) {
      await this.save(record);
    }
  }

  /**
   * Find environmental monitoring record by its ID
   */
  async findById(id: string): Promise<EnvironmentalMonitoring | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(eq(environmentalMonitoringTable.id, id))
      .limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  /**
   * Find environmental monitoring record by monitoring point ID and parameter
   */
  async findByMonitoringPointAndParameter(
    monitoringPointId: string,
    parameter: string,
    monitoringDate: Date,
  ): Promise<EnvironmentalMonitoring | null> {
    const db = this.databaseService.getDb();
    const result = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(
        and(
          eq(environmentalMonitoringTable.monitoringPointId, monitoringPointId),
          eq(environmentalMonitoringTable.parameter, parameter),
          eq(environmentalMonitoringTable.monitoringDate, monitoringDate),
        ),
      )
      .limit(1);

    if (result.length === 0 || !result[0]) {
      return null;
    }

    return this.mapToDomain(result[0]);
  }

  /**
   * Find all environmental monitoring records for an organization
   */
  async findByOrganizationId(
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
  ): Promise<EnvironmentalMonitoring[]> {
    const conditions = [
      eq(environmentalMonitoringTable.organizationId, organizationId),
    ];

    if (options?.monitoringType) {
      conditions.push(
        eq(environmentalMonitoringTable.monitoringType, options.monitoringType),
      );
    }

    if (options?.parameter) {
      conditions.push(
        eq(environmentalMonitoringTable.parameter, options.parameter),
      );
    }

    if (options?.isCompliant !== undefined) {
      conditions.push(
        eq(environmentalMonitoringTable.isCompliant, options.isCompliant),
      );
    }

    if (options?.startDate) {
      conditions.push(
        gte(environmentalMonitoringTable.monitoringDate, options.startDate),
      );
    }

    if (options?.endDate) {
      conditions.push(
        lte(environmentalMonitoringTable.monitoringDate, options.endDate),
      );
    }

    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(and(...conditions))
      .orderBy(desc(environmentalMonitoringTable.monitoringDate))
      .offset(options?.offset || 0)
      .limit(options?.limit || 1000);

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find environmental monitoring records associated with a well
   */
  async findByWellId(wellId: string): Promise<EnvironmentalMonitoring[]> {
    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(eq(environmentalMonitoringTable.wellId, wellId))
      .orderBy(desc(environmentalMonitoringTable.monitoringDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find environmental monitoring records that exceed compliance limits
   */
  async findComplianceViolations(
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]> {
    const conditions = [eq(environmentalMonitoringTable.isCompliant, false)];

    if (organizationId) {
      conditions.push(
        eq(environmentalMonitoringTable.organizationId, organizationId),
      );
    }

    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(and(...conditions))
      .orderBy(desc(environmentalMonitoringTable.monitoringDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find environmental monitoring records that are overdue for reporting
   */
  async findOverdueForReporting(
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]> {
    const today = new Date().toISOString().substring(0, 10);

    const conditions = [
      eq(environmentalMonitoringTable.reportRequired, true),
      lt(environmentalMonitoringTable.dueDate, today),
    ];

    if (organizationId) {
      conditions.push(
        eq(environmentalMonitoringTable.organizationId, organizationId),
      );
    }

    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(and(...conditions))
      .orderBy(asc(environmentalMonitoringTable.dueDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find environmental monitoring records requiring calibration
   */
  async findRequiringCalibration(
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]> {
    const today = new Date().toISOString().substring(0, 10);

    const conditions = [
      lt(environmentalMonitoringTable.nextCalibrationDate, today),
    ];

    if (organizationId) {
      conditions.push(
        eq(environmentalMonitoringTable.organizationId, organizationId),
      );
    }

    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(and(...conditions))
      .orderBy(asc(environmentalMonitoringTable.nextCalibrationDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find environmental monitoring records by monitoring type
   */
  async findByMonitoringType(
    monitoringType: string,
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]> {
    const conditions = [
      eq(environmentalMonitoringTable.monitoringType, monitoringType),
    ];

    if (organizationId) {
      conditions.push(
        eq(environmentalMonitoringTable.organizationId, organizationId),
      );
    }

    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(and(...conditions))
      .orderBy(desc(environmentalMonitoringTable.monitoringDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Find environmental monitoring records by parameter
   */
  async findByParameter(
    parameter: string,
    organizationId?: string,
  ): Promise<EnvironmentalMonitoring[]> {
    const conditions = [eq(environmentalMonitoringTable.parameter, parameter)];

    if (organizationId) {
      conditions.push(
        eq(environmentalMonitoringTable.organizationId, organizationId),
      );
    }

    const db = this.databaseService.getDb();
    const results = await db
      .select()
      .from(environmentalMonitoringTable)
      .where(and(...conditions))
      .orderBy(desc(environmentalMonitoringTable.monitoringDate));

    return results.map((row) => this.mapToDomain(row));
  }

  /**
   * Count environmental monitoring records by compliance status for an organization
   */
  async countByComplianceStatus(
    organizationId: string,
  ): Promise<Record<string, number>> {
    const db = this.databaseService.getDb();
    const results = await db
      .select({
        isCompliant: environmentalMonitoringTable.isCompliant,
        count: sql<number>`count(*)`,
      })
      .from(environmentalMonitoringTable)
      .where(eq(environmentalMonitoringTable.organizationId, organizationId))
      .groupBy(environmentalMonitoringTable.isCompliant);

    const complianceCounts: Record<string, number> = {};
    for (const result of results) {
      const key = result.isCompliant ? 'compliant' : 'non_compliant';
      // eslint-disable-next-line security/detect-object-injection
      complianceCounts[key] = result.count;
    }

    return complianceCounts;
  }

  /**
   * Count environmental monitoring records by monitoring type for an organization
   */
  async countByMonitoringType(
    organizationId: string,
  ): Promise<Record<string, number>> {
    const db = this.databaseService.getDb();
    const results = await db
      .select({
        monitoringType: environmentalMonitoringTable.monitoringType,
        count: sql<number>`count(*)`,
      })
      .from(environmentalMonitoringTable)
      .where(eq(environmentalMonitoringTable.organizationId, organizationId))
      .groupBy(environmentalMonitoringTable.monitoringType);

    const typeCounts: Record<string, number> = {};
    for (const result of results) {
      typeCounts[result.monitoringType] = result.count;
    }

    return typeCounts;
  }

  /**
   * Delete an environmental monitoring record by ID
   */
  async delete(id: string): Promise<void> {
    const db = this.databaseService.getDb();
    await db
      .delete(environmentalMonitoringTable)
      .where(eq(environmentalMonitoringTable.id, id));
  }

  /**
   * Check if a monitoring record exists for the given point, parameter, and date
   */
  async existsByMonitoringPointParameterAndDate(
    monitoringPointId: string,
    parameter: string,
    monitoringDate: Date,
    excludeId?: string,
  ): Promise<boolean> {
    const conditions = [
      eq(environmentalMonitoringTable.monitoringPointId, monitoringPointId),
      eq(environmentalMonitoringTable.parameter, parameter),
      eq(environmentalMonitoringTable.monitoringDate, monitoringDate),
    ];

    if (excludeId) {
      conditions.push(sql`${environmentalMonitoringTable.id} != ${excludeId}`);
    }

    const db = this.databaseService.getDb();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(environmentalMonitoringTable)
      .where(and(...conditions))
      .limit(1);

    return (result[0]?.count ?? 0) > 0;
  }

  /**
   * Map database row to domain entity
   */
  private mapToDomain(
    row: typeof environmentalMonitoringTable.$inferSelect,
  ): EnvironmentalMonitoring {
    // Create monitoring record with required constructor parameters
    const monitoring = new EnvironmentalMonitoring(
      row.id,
      row.monitoringPointId,
      MonitoringType.fromString(row.monitoringType),
      row.organizationId,
      row.parameter,
      row.unitOfMeasure,
      row.monitoringDate,
      row.monitoredByUserId,
    );

    // Set optional properties using setters
    monitoring.wellId = row.wellId ?? undefined;
    monitoring.location = row.location ?? undefined;
    monitoring.facilityId = row.facilityId ?? undefined;
    monitoring.equipmentId = row.equipmentId ?? undefined;
    monitoring.detectionLimit = row.detectionLimit
      ? parseFloat(row.detectionLimit)
      : undefined;
    monitoring.exceedanceThreshold = row.exceedanceThreshold
      ? parseFloat(row.exceedanceThreshold)
      : undefined;
    monitoring.regulatoryStandard = row.regulatoryStandard ?? undefined;
    monitoring.monitoringMethod = row.monitoringMethod ?? undefined;
    monitoring.equipmentType = row.equipmentType ?? undefined;
    monitoring.equipmentSerialNumber = row.equipmentSerialNumber ?? undefined;
    monitoring.calibrationDate = row.calibrationDate
      ? new Date(row.calibrationDate)
      : undefined;
    monitoring.nextCalibrationDate = row.nextCalibrationDate
      ? new Date(row.nextCalibrationDate)
      : undefined;
    monitoring.qaQcMethod = row.qaQcMethod ?? undefined;
    monitoring.dataQualityIndicator = row.dataQualityIndicator ?? undefined;
    monitoring.weatherConditions =
      (row.weatherConditions as Record<string, unknown>) ?? undefined;
    monitoring.operationalConditions =
      (row.operationalConditions as Record<string, unknown>) ?? undefined;
    monitoring.reportingPeriod = row.reportingPeriod ?? undefined;
    monitoring.dueDate = row.dueDate ? new Date(row.dueDate) : undefined;
    monitoring.reportedDate = row.reportedDate
      ? new Date(row.reportedDate)
      : undefined;
    monitoring.reportNumber = row.reportNumber ?? undefined;
    monitoring.correctiveActions =
      (row.correctiveActions as Record<string, unknown>[]) ?? undefined;
    monitoring.followUpDate = row.followUpDate
      ? new Date(row.followUpDate)
      : undefined;
    monitoring.reviewedByUserId = row.reviewedByUserId ?? undefined;
    monitoring.createdAt = row.createdAt;
    monitoring.updatedAt = row.updatedAt;

    return monitoring;
  }
}
