import { Injectable } from '@nestjs/common';
import { IValueObjectFactory, FactoryResult } from './factory.interface';
import { PermitType } from '../value-objects/permit-type.vo';
import { PermitStatus } from '../value-objects/permit-status.vo';
import { IncidentType } from '../value-objects/incident-type.vo';
import { IncidentSeverity } from '../value-objects/incident-severity.vo';
import { MonitoringType } from '../value-objects/monitoring-type.vo';
import { ReportType } from '../value-objects/report-type.vo';
import { ReportStatus } from '../value-objects/report-status.vo';

/**
 * Permit Type Factory
 */
@Injectable()
export class PermitTypeFactory
  implements IValueObjectFactory<string, PermitType>
{
  async create(input: string): Promise<FactoryResult<PermitType>> {
    return this.fromString(input);
  }

  async validate(
    input: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (!input?.trim()) {
      errors.push('Permit type cannot be empty');
      return Promise.resolve({ isValid: false, errors });
    }

    try {
      PermitType.fromString(input);
      return Promise.resolve({ isValid: true });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid permit type',
      );
      return Promise.resolve({ isValid: false, errors });
    }
  }

  fromString(value: string): Promise<FactoryResult<PermitType>> {
    try {
      const permitType = PermitType.fromString(value);
      return Promise.resolve({
        success: true,
        data: permitType,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error ? error.message : 'Invalid permit type value',
        ],
      });
    }
  }

  async fromValues(...values: unknown[]): Promise<FactoryResult<PermitType>> {
    const value = values[0] as string;
    return this.fromString(value);
  }

  getPossibleValues(): Promise<string[]> {
    return Promise.resolve([
      'drilling',
      'completion',
      'production',
      'injection',
      'disposal',
      'transportation',
      'storage',
      'processing',
    ]);
  }

  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } {
    return {
      factoryType: 'PermitTypeFactory',
      supportedTypes: ['PermitType'],
      version: '1.0.0',
    };
  }
}

/**
 * Permit Status Factory
 */
@Injectable()
export class PermitStatusFactory
  implements IValueObjectFactory<string, PermitStatus>
{
  async create(input: string): Promise<FactoryResult<PermitStatus>> {
    return this.fromString(input);
  }

  async validate(
    input: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (!input?.trim()) {
      errors.push('Permit status cannot be empty');
      return Promise.resolve({ isValid: false, errors });
    }

    try {
      PermitStatus.fromString(input);
      return Promise.resolve({ isValid: true });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid permit status',
      );
      return Promise.resolve({ isValid: false, errors });
    }
  }

  fromString(value: string): Promise<FactoryResult<PermitStatus>> {
    try {
      const status = PermitStatus.fromString(value);
      return Promise.resolve({
        success: true,
        data: status,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Invalid permit status value',
        ],
      });
    }
  }

  async fromValues(...values: unknown[]): Promise<FactoryResult<PermitStatus>> {
    const value = values[0] as string;
    return this.fromString(value);
  }

  getPossibleValues(): Promise<string[]> {
    return Promise.resolve([
      'draft',
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'expired',
      'revoked',
      'suspended',
    ]);
  }

  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } {
    return {
      factoryType: 'PermitStatusFactory',
      supportedTypes: ['PermitStatus'],
      version: '1.0.0',
    };
  }
}

/**
 * Incident Type Factory
 */
@Injectable()
export class IncidentTypeFactory
  implements IValueObjectFactory<string, IncidentType>
{
  async create(input: string): Promise<FactoryResult<IncidentType>> {
    return this.fromString(input);
  }

  async validate(
    input: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (!input?.trim()) {
      errors.push('Incident type cannot be empty');
      return Promise.resolve({ isValid: false, errors });
    }

    try {
      IncidentType.fromString(input);
      return Promise.resolve({ isValid: true });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid incident type',
      );
      return Promise.resolve({ isValid: false, errors });
    }
  }

  fromString(value: string): Promise<FactoryResult<IncidentType>> {
    try {
      const incidentType = IncidentType.fromString(value);
      return Promise.resolve({
        success: true,
        data: incidentType,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Invalid incident type value',
        ],
      });
    }
  }

  async fromValues(...values: unknown[]): Promise<FactoryResult<IncidentType>> {
    const value = values[0] as string;
    return this.fromString(value);
  }

  getPossibleValues(): Promise<string[]> {
    return Promise.resolve([
      'spill_release',
      'fire_explosion',
      'equipment_failure',
      'human_error',
      'natural_disaster',
      'theft_vandalism',
      'transportation_accident',
      'other',
    ]);
  }

  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } {
    return {
      factoryType: 'IncidentTypeFactory',
      supportedTypes: ['IncidentType'],
      version: '1.0.0',
    };
  }
}

/**
 * Incident Severity Factory
 */
@Injectable()
export class IncidentSeverityFactory
  implements IValueObjectFactory<string, IncidentSeverity>
{
  async create(input: string): Promise<FactoryResult<IncidentSeverity>> {
    return this.fromString(input);
  }

  async validate(
    input: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (!input?.trim()) {
      errors.push('Incident severity cannot be empty');
      return Promise.resolve({ isValid: false, errors });
    }

    try {
      IncidentSeverity.fromString(input);
      return Promise.resolve({ isValid: true });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid incident severity',
      );
      return Promise.resolve({ isValid: false, errors });
    }
  }

  fromString(value: string): Promise<FactoryResult<IncidentSeverity>> {
    try {
      const severity = IncidentSeverity.fromString(value);
      return Promise.resolve({
        success: true,
        data: severity,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Invalid incident severity value',
        ],
      });
    }
  }

  async fromValues(
    ...values: unknown[]
  ): Promise<FactoryResult<IncidentSeverity>> {
    const value = values[0] as string;
    return this.fromString(value);
  }

  getPossibleValues(): Promise<string[]> {
    return Promise.resolve([
      'minor',
      'moderate',
      'major',
      'critical',
      'catastrophic',
    ]);
  }

  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } {
    return {
      factoryType: 'IncidentSeverityFactory',
      supportedTypes: ['IncidentSeverity'],
      version: '1.0.0',
    };
  }
}

/**
 * Monitoring Type Factory
 */
@Injectable()
export class MonitoringTypeFactory
  implements IValueObjectFactory<string, MonitoringType>
{
  async create(input: string): Promise<FactoryResult<MonitoringType>> {
    return this.fromString(input);
  }

  async validate(
    input: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (!input?.trim()) {
      errors.push('Monitoring type cannot be empty');
      return Promise.resolve({ isValid: false, errors });
    }

    try {
      MonitoringType.fromString(input);
      return Promise.resolve({ isValid: true });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid monitoring type',
      );
      return Promise.resolve({ isValid: false, errors });
    }
  }

  fromString(value: string): Promise<FactoryResult<MonitoringType>> {
    try {
      const monitoringType = MonitoringType.fromString(value);
      return Promise.resolve({
        success: true,
        data: monitoringType,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Invalid monitoring type value',
        ],
      });
    }
  }

  async fromValues(
    ...values: unknown[]
  ): Promise<FactoryResult<MonitoringType>> {
    const value = values[0] as string;
    return this.fromString(value);
  }

  getPossibleValues(): Promise<string[]> {
    return Promise.resolve([
      'air_quality',
      'water_quality',
      'soil_contamination',
      'noise_level',
      'radiation',
      'waste_volume',
      'emission_rate',
      'groundwater_level',
    ]);
  }

  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } {
    return {
      factoryType: 'MonitoringTypeFactory',
      supportedTypes: ['MonitoringType'],
      version: '1.0.0',
    };
  }
}

/**
 * Report Type Factory
 */
@Injectable()
export class ReportTypeFactory
  implements IValueObjectFactory<string, ReportType>
{
  async create(input: string): Promise<FactoryResult<ReportType>> {
    return this.fromString(input);
  }

  async validate(
    input: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (!input?.trim()) {
      errors.push('Report type cannot be empty');
      return Promise.resolve({ isValid: false, errors });
    }

    try {
      ReportType.fromString(input);
      return Promise.resolve({ isValid: true });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid report type',
      );
      return Promise.resolve({ isValid: false, errors });
    }
  }

  fromString(value: string): Promise<FactoryResult<ReportType>> {
    try {
      const reportType = ReportType.fromString(value);
      return Promise.resolve({
        success: true,
        data: reportType,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error ? error.message : 'Invalid report type value',
        ],
      });
    }
  }

  async fromValues(...values: unknown[]): Promise<FactoryResult<ReportType>> {
    const value = values[0] as string;
    return this.fromString(value);
  }

  getPossibleValues(): Promise<string[]> {
    return Promise.resolve([
      'monthly_production',
      'quarterly_environmental',
      'annual_compliance',
      'incident_report',
      'spill_report',
      'emission_inventory',
      'waste_manifest',
      'safety_statistics',
      'financial_report',
      'operational_summary',
    ]);
  }

  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } {
    return {
      factoryType: 'ReportTypeFactory',
      supportedTypes: ['ReportType'],
      version: '1.0.0',
    };
  }
}

/**
 * Report Status Factory
 */
@Injectable()
export class ReportStatusFactory
  implements IValueObjectFactory<string, ReportStatus>
{
  async create(input: string): Promise<FactoryResult<ReportStatus>> {
    return this.fromString(input);
  }

  async validate(
    input: string,
  ): Promise<{ isValid: boolean; errors?: string[]; warnings?: string[] }> {
    const errors: string[] = [];

    if (!input?.trim()) {
      errors.push('Report status cannot be empty');
      return Promise.resolve({ isValid: false, errors });
    }

    try {
      ReportStatus.fromString(input);
      return Promise.resolve({ isValid: true });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : 'Invalid report status',
      );
      return Promise.resolve({ isValid: false, errors });
    }
  }

  fromString(value: string): Promise<FactoryResult<ReportStatus>> {
    try {
      const status = ReportStatus.fromString(value);
      return Promise.resolve({
        success: true,
        data: status,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Invalid report status value',
        ],
      });
    }
  }

  async fromValues(...values: unknown[]): Promise<FactoryResult<ReportStatus>> {
    const value = values[0] as string;
    return this.fromString(value);
  }

  getPossibleValues(): Promise<string[]> {
    return Promise.resolve([
      'draft',
      'in_review',
      'approved',
      'submitted',
      'accepted',
      'rejected',
      'overdue',
      'archived',
    ]);
  }

  getMetadata(): {
    factoryType: string;
    supportedTypes: string[];
    version: string;
  } {
    return {
      factoryType: 'ReportStatusFactory',
      supportedTypes: ['ReportStatus'],
      version: '1.0.0',
    };
  }
}
