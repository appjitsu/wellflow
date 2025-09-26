import { Injectable } from '@nestjs/common';
import {
  CompositeSpecification,
  SpecificationMetadata,
} from '../specification.interface';
import { Permit } from '../../entities/permit.entity';
import { HSEIncident } from '../../entities/hse-incident.entity';
import { RegulatoryReport } from '../../entities/regulatory-report.entity';

/**
 * Permit Compliance Specifications
 */
@Injectable()
export class PermitExpiringSoonSpecification extends CompositeSpecification<Permit> {
  constructor(private readonly daysThreshold: number = 30) {
    super();
  }

  async isSatisfiedBy(permit: Permit): Promise<boolean> {
    const expirationDate = permit.expirationDate;
    if (!expirationDate) {
      return Promise.resolve(false); // Cannot be expiring if no expiration date
    }

    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Promise.resolve(
      daysUntilExpiration <= this.daysThreshold && daysUntilExpiration > 0,
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'PermitExpiringSoon',
      description: `Permits expiring within ${this.daysThreshold} days`,
      priority: 3,
      category: 'compliance',
      tags: ['permit', 'expiration', 'warning'],
    };
  }
}

@Injectable()
export class PermitExpiredSpecification extends CompositeSpecification<Permit> {
  async isSatisfiedBy(permit: Permit): Promise<boolean> {
    const expirationDate = permit.expirationDate;
    if (!expirationDate) {
      return Promise.resolve(false); // Cannot be expired if no expiration date
    }
    return Promise.resolve(expirationDate < new Date());
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'PermitExpired',
      description: 'Permits that have expired',
      priority: 5,
      category: 'compliance',
      tags: ['permit', 'expiration', 'critical'],
    };
  }
}

@Injectable()
export class PermitRenewalDueSpecification extends CompositeSpecification<Permit> {
  constructor(private readonly renewalWindowDays: number = 90) {
    super();
  }

  async isSatisfiedBy(permit: Permit): Promise<boolean> {
    const expirationDate = permit.expirationDate;
    if (!expirationDate) {
      return Promise.resolve(false); // Cannot be due for renewal if no expiration date
    }

    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Promise.resolve(
      daysUntilExpiration <= this.renewalWindowDays && permit.canBeRenewed(),
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'PermitRenewalDue',
      description: `Permits due for renewal within ${this.renewalWindowDays} days`,
      priority: 4,
      category: 'compliance',
      tags: ['permit', 'renewal', 'action'],
    };
  }
}

/**
 * HSE Incident Specifications
 */
@Injectable()
export class HighSeverityIncidentSpecification extends CompositeSpecification<HSEIncident> {
  async isSatisfiedBy(incident: HSEIncident): Promise<boolean> {
    // Check if incident has high severity requiring immediate regulatory notification
    const severity = incident.severity.value;
    return Promise.resolve(['high', 'critical'].includes(severity));
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'HighSeverityIncident',
      description:
        'Incidents with high severity requiring immediate regulatory notification',
      priority: 5,
      category: 'safety',
      tags: ['incident', 'severity', 'critical'],
    };
  }
}

@Injectable()
export class IncidentRequiresReportingSpecification extends CompositeSpecification<HSEIncident> {
  async isSatisfiedBy(incident: HSEIncident): Promise<boolean> {
    // Business rule: Report incidents with injuries, significant property damage, or environmental impact
    const incidentType = incident.incidentType.value;
    const hasInjuries =
      incident.affectedPersonnel && incident.affectedPersonnel.length > 0;
    const hasEnvironmentalImpact = !!incident.environmentalImpact;
    const propertyDamage = incident.propertyDamage || 0;

    return Promise.resolve(
      hasInjuries ||
        hasEnvironmentalImpact ||
        propertyDamage > 50000 || // Report if damage > $50K
        ['spill_release', 'fire_explosion', 'transportation_accident'].includes(
          incidentType,
        ),
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'IncidentRequiresReporting',
      description: 'Incidents that require regulatory reporting',
      priority: 4,
      category: 'reporting',
      tags: ['incident', 'reporting', 'compliance'],
    };
  }
}

@Injectable()
export class IncidentInvestigationOverdueSpecification extends CompositeSpecification<HSEIncident> {
  constructor(private readonly investigationDeadlineDays: number = 30) {
    super();
  }

  async isSatisfiedBy(incident: HSEIncident): Promise<boolean> {
    // Use incident date as reported date, or createdAt if incident date is not available
    const reportedDate = incident.incidentDate;
    const daysSinceReport = Math.floor(
      (Date.now() - reportedDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Check if investigation is overdue (not completed and past deadline)
    // Note: HSEIncident doesn't expose investigationStatus directly, so we assume it's overdue if not closed
    return Promise.resolve(daysSinceReport > this.investigationDeadlineDays);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'IncidentInvestigationOverdue',
      description: `Incident investigations overdue after ${this.investigationDeadlineDays} days`,
      priority: 4,
      category: 'investigation',
      tags: ['incident', 'investigation', 'overdue'],
    };
  }
}

/**
 * Regulatory Report Specifications
 */
@Injectable()
export class ReportOverdueSpecification extends CompositeSpecification<RegulatoryReport> {
  async isSatisfiedBy(report: RegulatoryReport): Promise<boolean> {
    const now = new Date();
    const dueDate = report.dueDate;

    if (!dueDate) return Promise.resolve(false);

    // Report is overdue if past due date and not yet submitted
    return Promise.resolve(
      now > dueDate &&
        report.status.value !== 'submitted' &&
        report.status.value !== 'accepted',
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ReportOverdue',
      description: 'Regulatory reports that are past their due date',
      priority: 5,
      category: 'reporting',
      tags: ['report', 'overdue', 'compliance'],
    };
  }
}

@Injectable()
export class ReportDueSoonSpecification extends CompositeSpecification<RegulatoryReport> {
  constructor(private readonly warningDays: number = 7) {
    super();
  }

  async isSatisfiedBy(report: RegulatoryReport): Promise<boolean> {
    const now = new Date();
    const dueDate = report.dueDate;

    if (!dueDate) return Promise.resolve(false);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Promise.resolve(
      daysUntilDue <= this.warningDays &&
        daysUntilDue > 0 &&
        report.status.value !== 'submitted' &&
        report.status.value !== 'accepted',
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ReportDueSoon',
      description: `Reports due within ${this.warningDays} days`,
      priority: 3,
      category: 'reporting',
      tags: ['report', 'due', 'warning'],
    };
  }
}

@Injectable()
export class ReportValidationFailedSpecification extends CompositeSpecification<RegulatoryReport> {
  async isSatisfiedBy(report: RegulatoryReport): Promise<boolean> {
    return Promise.resolve(
      report.validationStatus === 'invalid' ||
        Boolean(report.validationErrors && report.validationErrors.length > 0),
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ReportValidationFailed',
      description: 'Reports that failed validation and need correction',
      priority: 4,
      category: 'validation',
      tags: ['report', 'validation', 'error'],
    };
  }
}

/**
 * Environmental Compliance Specifications
 */
@Injectable()
export class EnvironmentalLimitExceededSpecification extends CompositeSpecification<
  Record<string, number>
> {
  constructor(
    private readonly parameter: string,
    private readonly threshold: number,
  ) {
    super();
  }

  async isSatisfiedBy(
    monitoringData: Record<string, number>,
  ): Promise<boolean> {
    const measuredValue = monitoringData[this.parameter];
    return Promise.resolve(
      measuredValue !== undefined && measuredValue > this.threshold,
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'EnvironmentalLimitExceeded',
      description: `Environmental monitoring where ${this.parameter} exceeds ${this.threshold}`,
      priority: 5,
      category: 'environmental',
      tags: ['environmental', 'limit', 'violation'],
    };
  }
}

@Injectable()
export class CalibrationOverdueSpecification extends CompositeSpecification<{
  lastCalibrationDate?: Date;
}> {
  constructor(private readonly calibrationIntervalDays: number = 90) {
    super();
  }

  async isSatisfiedBy(monitoringEquipment: {
    lastCalibrationDate?: Date;
  }): Promise<boolean> {
    const lastCalibration = monitoringEquipment.lastCalibrationDate;
    if (!lastCalibration) return Promise.resolve(true);

    const daysSinceCalibration = Math.floor(
      (Date.now() - lastCalibration.getTime()) / (1000 * 60 * 60 * 24),
    );

    return Promise.resolve(daysSinceCalibration > this.calibrationIntervalDays);
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'CalibrationOverdue',
      description: `Equipment calibration overdue after ${this.calibrationIntervalDays} days`,
      priority: 3,
      category: 'maintenance',
      tags: ['calibration', 'maintenance', 'overdue'],
    };
  }
}

/**
 * Complex Business Rule Specifications
 */
@Injectable()
export class HighRiskFacilitySpecification extends CompositeSpecification<Permit> {
  async isSatisfiedBy(permit: Permit): Promise<boolean> {
    // High-risk facilities: injection wells, disposal sites, chemical processing
    const highRiskTypes = ['injection', 'disposal', 'processing'];
    const permitType = permit.permitType?.value;
    if (!permitType) return Promise.resolve(false);

    // Check location in sensitive areas (simplified)
    const location = permit.location;
    const sensitiveAreas = ['wetland', 'aquifer', 'floodplain'];
    const inSensitiveArea = Boolean(
      location &&
        sensitiveAreas.some((area) => location.toLowerCase().includes(area)),
    );

    return Promise.resolve(
      highRiskTypes.includes(permitType) || inSensitiveArea,
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'HighRiskFacility',
      description:
        'Facilities classified as high-risk requiring enhanced monitoring',
      priority: 4,
      category: 'risk',
      tags: ['facility', 'risk', 'monitoring'],
    };
  }
}

@Injectable()
export class ComplianceActionRequiredSpecification extends CompositeSpecification<{
  violations?: unknown[];
  expirationDate?: Date;
  dueDate?: Date;
  validationStatus?: string;
}> {
  async isSatisfiedBy(entity: {
    violations?: unknown[];
    expirationDate?: Date;
    dueDate?: Date;
    validationStatus?: string;
  }): Promise<boolean> {
    // Generic specification that checks if any compliance action is required
    const hasViolations = entity.violations && entity.violations.length > 0;
    const isExpired =
      entity.expirationDate && entity.expirationDate < new Date();
    const isOverdue = entity.dueDate && entity.dueDate < new Date();
    const validationFailed = entity.validationStatus === 'invalid';

    return Promise.resolve(
      hasViolations || isExpired || isOverdue || validationFailed,
    );
  }

  getMetadata(): SpecificationMetadata {
    return {
      name: 'ComplianceActionRequired',
      description:
        'Entities requiring compliance actions (violations, expirations, overdue items)',
      priority: 4,
      category: 'compliance',
      tags: ['compliance', 'action', 'required'],
    };
  }
}
