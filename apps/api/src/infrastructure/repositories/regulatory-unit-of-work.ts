import { Inject, Injectable } from '@nestjs/common';
import { Entity, UnitOfWork } from './unit-of-work';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';
import { RegulatoryDomainEventPublisher } from '../../domain/shared/regulatory-domain-event-publisher';

// Import regulatory entities
import { Permit } from '../../domain/entities/permit.entity';
import { HSEIncident } from '../../domain/entities/hse-incident.entity';
import { EnvironmentalMonitoring } from '../../domain/entities/environmental-monitoring.entity';
import { RegulatoryReport } from '../../domain/entities/regulatory-report.entity';

// Import regulatory repositories
import { PermitRepositoryImpl } from './permit.repository';
import type { PermitRepository } from '../../domain/repositories/permit.repository';
import { HSEIncidentRepositoryImpl } from './hse-incident.repository';
import type { HSEIncidentRepository } from '../../domain/repositories/hse-incident.repository';
import { EnvironmentalMonitoringRepositoryImpl } from './environmental-monitoring.repository';
import type { EnvironmentalMonitoringRepository } from '../../domain/repositories/environmental-monitoring.repository';
import type { RegulatoryReportRepository } from '../../domain/repositories/regulatory-report.repository';

/**
 * Regulatory Unit of Work
 * Manages transactions across multiple regulatory entities
 * Implements the Unit of Work pattern for complex regulatory operations
 */
@Injectable()
export class RegulatoryUnitOfWork extends UnitOfWork {
  // Regulatory repositories
  private _permitRepository?: PermitRepository;
  private _hseIncidentRepository?: HSEIncidentRepository;
  private _environmentalMonitoringRepository?: EnvironmentalMonitoringRepository;
  private _regulatoryReportRepository?: RegulatoryReportRepository;

  constructor(
    @Inject('DATABASE_CONNECTION')
    db: NodePgDatabase<typeof schema>,
    private readonly eventPublisher: RegulatoryDomainEventPublisher,
  ) {
    super(db);

    // Register regulatory repository factories

    // this.registerRepository(Permit, () => this.getPermitRepository());
    // this.registerRepository(HSEIncident, () => this.getHSEIncidentRepository());
    // this.registerRepository(EnvironmentalMonitoring, () =>
    //   this.getEnvironmentalMonitoringRepository(),
    // );
    // this.registerRepository(RegulatoryReport, () =>
    //   this.getRegulatoryReportRepository(),
    // );
  }

  /**
   * Get permit repository
   */
  getPermitRepository(): PermitRepository {
    if (!this._permitRepository) {
      this._permitRepository = new PermitRepositoryImpl(this.db);
    }
    return this._permitRepository;
  }

  /**
   * Get HSE incident repository
   */
  getHSEIncidentRepository(): HSEIncidentRepository {
    if (!this._hseIncidentRepository) {
      this._hseIncidentRepository = new HSEIncidentRepositoryImpl(this.db);
    }
    return this._hseIncidentRepository;
  }

  /**
   * Get environmental monitoring repository
   */
  getEnvironmentalMonitoringRepository(): EnvironmentalMonitoringRepository {
    if (!this._environmentalMonitoringRepository) {
      this._environmentalMonitoringRepository =
        new EnvironmentalMonitoringRepositoryImpl(this.db);
    }
    return this._environmentalMonitoringRepository;
  }

  /**
   * Get regulatory report repository
   */
  getRegulatoryReportRepository(): RegulatoryReportRepository {
    if (!this._regulatoryReportRepository) {
      // NOTE: RegulatoryReportRepositoryImpl needs implementation
      throw new Error('RegulatoryReportRepositoryImpl not implemented yet');
    }
    return this._regulatoryReportRepository;
  }

  /**
   * Save permit within transaction
   */
  savePermit(permit: Permit): void {
    this.registerNew(permit);
  }

  /**
   * Save multiple permits within transaction
   */
  savePermits(permits: Permit[]): void {
    permits.forEach((permit) => this.registerNew(permit));
  }

  /**
   * Update permit within transaction
   */
  updatePermit(permit: Permit): void {
    this.registerDirty(permit);
  }

  /**
   * Delete permit within transaction
   */
  deletePermit(permit: Permit): void {
    this.registerDeleted(permit);
  }

  /**
   * Save HSE incident within transaction
   */
  saveHSEIncident(incident: HSEIncident): void {
    this.registerNew(incident);
  }

  /**
   * Save environmental monitoring record within transaction
   */
  saveEnvironmentalMonitoring(monitoring: EnvironmentalMonitoring): void {
    this.registerNew(monitoring);
  }

  /**
   * Save regulatory report within transaction
   */
  saveRegulatoryReport(report: RegulatoryReport): void {
    this.registerNew(report);
  }

  /**
   * Override commit to publish domain events after successful transaction
   */
  override async commit(): Promise<void> {
    // Get all entities that will be committed
    const entitiesToPublish = [
      ...this.getNewObjects(),
      ...this.getDirtyObjects(),
    ] as (Permit | HSEIncident | EnvironmentalMonitoring | RegulatoryReport)[];

    // Call parent commit
    await super.commit();

    // Publish domain events for all committed entities
    for (const entity of entitiesToPublish) {
      if (entity.hasDomainEvents()) {
        await entity.publishDomainEvents(
          this.eventPublisher,
          entity.organizationId,
        );
      }
    }
  }

  /**
   * Process permit renewal workflow
   * Complex transaction involving permit update and renewal record creation
   */
  async processPermitRenewal(
    permit: Permit,
    renewalData: {
      renewalDate: Date;
      newExpirationDate: Date;
      renewalFee?: number;
      updatedConditions?: Record<string, unknown>;
      approvedByUserId: string;
    },
  ): Promise<void> {
    this.begin();

    try {
      // Update permit expiration and status
      permit.renew(renewalData.approvedByUserId, renewalData.newExpirationDate);
      if (renewalData.updatedConditions) {
        permit.updateConditions(
          renewalData.updatedConditions,
          renewalData.approvedByUserId,
        );
      }

      this.registerDirty(permit);

      // NOTE: Future enhancement - Create renewal record in permit_renewals table
      // This would involve creating a PermitRenewal entity and saving it

      await this.commit();
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Process HSE incident response workflow
   * Complex transaction involving incident update and response record creation
   */
  async processIncidentResponse(
    incident: HSEIncident,
    responseData: {
      responseType: string;
      responseDescription: string;
      correctiveActions: string[];
      preventiveMeasures: string[];
      responsibleUserId: string;
      targetCompletionDate: Date;
    },
  ): Promise<void> {
    this.begin();

    try {
      // Update incident status
      incident.startInvestigation(responseData.responsibleUserId);
      // NOTE: Future enhancement - Add methods for corrective actions and preventive measures
      // incident.addCorrectiveActions(responseData.correctiveActions);
      // incident.addPreventiveMeasures(responseData.preventiveMeasures);

      this.registerDirty(incident);

      // NOTE: Future enhancement - Create incident response record in incident_responses table
      // This would involve creating an IncidentResponse entity and saving it

      await this.commit();
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Process environmental compliance violation
   * Complex transaction involving monitoring update and violation record
   */
  async processComplianceViolation(
    monitoring: EnvironmentalMonitoring,
    _violationData: {
      violationType: string;
      exceedanceAmount: number;
      regulatoryLimit: number;
      requiredActions: string[];
      complianceDeadline: Date;
      notifiedUserId: string;
    },
  ): Promise<void> {
    this.begin();

    try {
      // Record the violation
      // NOTE: Future enhancement - Add recordComplianceViolation method to EnvironmentalMonitoring entity
      // monitoring.recordComplianceViolation(
      //   violationData.exceedanceAmount,
      //   violationData.regulatoryLimit,
      //   violationData.requiredActions,
      //   violationData.complianceDeadline,
      //   violationData.notifiedUserId,
      // );

      this.registerDirty(monitoring);

      // NOTE: Future enhancement - Create compliance violation record
      // This would involve creating a ComplianceViolation entity and saving it

      await this.commit();
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Process regulatory report submission workflow
   * Complex transaction involving report update, validation, and submission
   */
  async processReportSubmission(
    report: RegulatoryReport,
    submissionData: {
      submittedByUserId: string;
      validationResults?: Record<string, unknown>;
      externalSubmissionId?: string;
      confirmationNumber?: string;
    },
  ): Promise<void> {
    this.begin();

    try {
      // Validate report if validation results provided
      if (submissionData.validationResults) {
        const isValid = this.validateReportData(
          submissionData.validationResults,
        );
        if (isValid) {
          report.setValidationResult('valid');
        } else {
          report.setValidationResult(
            'invalid',
            submissionData.validationResults.errors as
              | Record<string, unknown>[]
              | undefined,
          );
          throw new Error('Report validation failed');
        }
      }

      // Submit the report
      report.submitReport(
        submissionData.submittedByUserId,
        undefined, // submissionMethod
        submissionData.externalSubmissionId,
      );

      if (submissionData.confirmationNumber) {
        report.markAsAccepted(submissionData.confirmationNumber);
      }

      this.registerDirty(report);

      await this.commit();
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Bulk process permits (renewals, status updates)
   * Optimized for large-scale permit management operations
   */
  async bulkProcessPermits(
    permits: Permit[],
    operation: 'renew' | 'expire' | 'status_update',
    operationData?: {
      newExpirationDate?: Date;
      newStatus?: string;
      approvedByUserId?: string;
    },
  ): Promise<void> {
    this.begin();

    try {
      for (const permit of permits) {
        switch (operation) {
          case 'renew':
            if (
              operationData?.newExpirationDate &&
              operationData?.approvedByUserId
            ) {
              permit.renew(
                operationData.approvedByUserId,
                operationData.newExpirationDate,
              );
            }
            break;
          case 'expire':
            permit.markAsExpired();
            break;
          case 'status_update':
            // Note: This would need a more sophisticated status update method
            break;
        }

        this.registerDirty(permit);
      }

      await this.commit();
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Bulk process environmental monitoring records
   * Optimized for large-scale environmental data processing
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async bulkProcessMonitoringRecords(
    records: EnvironmentalMonitoring[],
    operation: 'validate' | 'archive' | 'flag_violations',
    operationData?: {
      validationRules?: Record<string, unknown>;
      archiveDate?: Date;
      violationThresholds?: Record<string, number>;
    },
  ): Promise<void> {
    this.begin();

    try {
      for (const record of records) {
        switch (operation) {
          case 'validate':
            if (operationData?.validationRules) {
              const validationResult = this.validateMonitoringData(
                record,
                operationData.validationRules,
              );
              record.setValidationResult(
                validationResult.isValid ? 'valid' : 'invalid',
                validationResult.errors,
              );
            }
            break;
          case 'archive':
            if (operationData?.archiveDate) {
              // NOTE: Future enhancement - Add archive method to EnvironmentalMonitoring entity
              // record.archive(operationData.archiveDate);
            }
            break;
          case 'flag_violations':
            if (operationData?.violationThresholds) {
              // Check for violations and flag them
              this.checkForViolations(
                record,
                operationData.violationThresholds,
              );
            }
            break;
        }

        this.registerDirty(record);
      }

      await this.commit();
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  /**
   * Get regulatory compliance statistics
   * Aggregates data across multiple regulatory entities
   */
  async getComplianceStatistics(organizationId: string): Promise<{
    permits: {
      total: number;
      active: number;
      expiringSoon: number;
      expired: number;
      complianceRate: number;
    };
    incidents: {
      total: number;
      open: number;
      closed: number;
      averageResolutionTime: number;
    };
    monitoring: {
      totalRecords: number;
      compliantRecords: number;
      violations: number;
      complianceRate: number;
    };
    reports: {
      total: number;
      submittedOnTime: number;
      overdue: number;
      acceptanceRate: number;
    };
  }> {
    // Get permit statistics
    const permitStats =
      await this.getPermitRepository().getPermitStatistics(organizationId);

    // Calculate permit compliance rate
    const permitComplianceRate =
      permitStats.totalPermits > 0
        ? ((permitStats.active + permitStats.expiringWithin30Days) /
            permitStats.totalPermits) *
          100
        : 0;

    // NOTE: Future implementation - Get incident statistics from HSEIncidentRepository
    const incidentStats = {
      total: 0,
      open: 0,
      closed: 0,
      averageResolutionTime: 0,
    };

    // NOTE: Future implementation - Get monitoring statistics from EnvironmentalMonitoringRepository
    const monitoringStats = {
      totalRecords: 0,
      compliantRecords: 0,
      violations: 0,
      complianceRate: 0,
    };

    // NOTE: Future implementation - Get report statistics from RegulatoryReportRepository
    const reportStats = {
      total: 0,
      submittedOnTime: 0,
      overdue: 0,
      acceptanceRate: 0,
    };

    return {
      permits: {
        total: permitStats.totalPermits,
        active: permitStats.active,
        expiringSoon: permitStats.expiringWithin30Days,
        expired: permitStats.expired,
        complianceRate: permitComplianceRate,
      },
      incidents: incidentStats,
      monitoring: monitoringStats,
      reports: reportStats,
    };
  }

  // Private helper methods

  private validateReportData(
    validationResults: Record<string, unknown>,
  ): boolean {
    // NOTE: Future implementation - Implement comprehensive report validation logic
    return (
      !validationResults.errors ||
      (validationResults.errors as unknown[]).length === 0
    );
  }

  private validateMonitoringData(
    _record: EnvironmentalMonitoring,
    _rules: Record<string, unknown>,
  ): { isValid: boolean; errors?: Record<string, unknown>[] } {
    // NOTE: Future implementation - Implement monitoring data validation logic
    return { isValid: true };
  }

  private checkForViolations(
    _record: EnvironmentalMonitoring,
    _thresholds: Record<string, number>,
  ): void {
    // NOTE: Future implementation - Implement violation checking logic
  }

  // Helper methods to access parent class collections
  private getNewObjects(): Entity[] {
    const objects = (this as unknown as { newObjects?: Map<string, Entity> })
      .newObjects;
    return objects ? Array.from(objects.values()) : [];
  }

  private getDirtyObjects(): Entity[] {
    const objects = (this as unknown as { dirtyObjects?: Map<string, Entity> })
      .dirtyObjects;
    return objects ? Array.from(objects.values()) : [];
  }
}
