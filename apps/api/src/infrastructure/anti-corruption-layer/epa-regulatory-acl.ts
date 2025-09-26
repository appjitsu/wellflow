import { Injectable } from '@nestjs/common';
import { BaseRegulatoryACL } from './base-regulatory-acl';
import type { RegulatoryReport } from '../../domain/entities/regulatory-report.entity';
import type {
  TransformationContext,
  TransformationResult,
} from './acl.interface';

/**
 * EPA Anti-Corruption Layer
 * Handles EPA's Clean Air Act and Clean Water Act reporting APIs
 */
@Injectable()
export class EPARegulatoryACL extends BaseRegulatoryACL {
  private readonly supportedVersions = ['v2.0', 'v1.5', 'v1.0'];

  getIdentifier(): string {
    return 'EPA_ACL';
  }

  canHandle(externalSystem: string, version?: string): boolean {
    if (externalSystem.toLowerCase() !== 'epa') return false;

    if (!version) return true; // Support all versions if not specified

    return this.supportedVersions.includes(version);
  }

  async transformToDomain<TDomain>(
    externalData: unknown,
    context: TransformationContext,
  ): Promise<TransformationResult<TDomain>> {
    const startTime = Date.now();

    try {
      // Validate external data structure
      const validationSchema = {
        requiredFields: ['facilityId', 'reportingPeriod', 'emissions'],
        optionalFields: ['complianceStatus', 'violations', 'correctiveActions'],
        fieldTypes: {
          facilityId: 'string',
          reportingPeriod: 'object',
          emissions: 'object',
          complianceStatus: 'string',
        } as Record<
          string,
          'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
        >,
      };

      const validation = await this.validateExternalData(
        externalData,
        validationSchema,
      );
      if (!validation.isValid) {
        return this.createTransformationResult<TDomain>(
          false,
          undefined,
          validation.errors.map((e) => e.message),
        );
      }

      // Transform EPA format to internal domain format
      const epaData = externalData as {
        facilityId?: string;
        reportType?: string;
        reportingPeriod?: {
          startDate?: string | number | Date;
          endDate?: string | number | Date;
        };
        emissions?: unknown;
        complianceStatus?: string;
        violations?: unknown;
        correctiveActions?: unknown;
        validationStatus?: string;
      };
      const domainData = {
        organizationId: context.userId || 'unknown',
        facilityId: epaData.facilityId || '',
        regulatoryAgency: 'EPA',
        reportType: this.mapEPAReportType(epaData.reportType || ''),
        reportingPeriodStart: new Date(
          epaData.reportingPeriod?.startDate || new Date(),
        ),
        reportingPeriodEnd: new Date(
          epaData.reportingPeriod?.endDate || new Date(),
        ),
        submissionData: {
          emissions: epaData.emissions,
          complianceStatus: epaData.complianceStatus,
          violations: epaData.violations,
          correctiveActions: epaData.correctiveActions,
        },
        validationStatus: epaData.validationStatus || 'pending',
        complianceStatus: this.mapEPAComplianceStatus(
          epaData.complianceStatus || '',
        ),
        createdByUserId: context.userId || 'system',
      };

      const executionTime = Date.now() - startTime;
      this.trackTransformation(true, executionTime);

      return this.createTransformationResult(
        true,
        domainData as TDomain,
        undefined,
        undefined,
        {
          transformationTime: executionTime,
          fieldsMapped: Object.keys(domainData).length,
          fieldsSkipped: 0,
          externalVersion: context.externalVersion || 'v2.0',
          internalVersion: '1.0',
        },
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackTransformation(false, executionTime);

      return this.createTransformationResult<TDomain>(false, undefined, [
        error instanceof Error ? error.message : 'EPA transformation failed',
      ]);
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async transformToExternal(
    domainData: unknown,
    context: TransformationContext,
  ): Promise<TransformationResult<unknown>> {
    const startTime = Date.now();

    try {
      const report = domainData as RegulatoryReport & {
        submissionData?: {
          emissions?: unknown;
          complianceStatus?: string;
          violations?: unknown;
          correctiveActions?: unknown;
        };
      };
      const externalData = {
        EPASubmission: {
          version: context.externalVersion || 'v2.0',
          facilityId: report.organizationId,
          reportingPeriod: {
            startDate: report.reportingPeriodStart?.toISOString(),
            endDate: report.reportingPeriodEnd?.toISOString(),
          },
          reportType: this.mapToEPAReportType(report.reportType.value),
          emissions: report.submissionData?.emissions,
          complianceStatus: this.mapToEPAComplianceStatus(
            report.complianceStatus,
          ),
          validationStatus: report.validationStatus,
          submittedAt: new Date().toISOString(),
          submitterId: context.userId,
        },
      };

      const executionTime = Date.now() - startTime;
      this.trackTransformation(true, executionTime);

      return this.createTransformationResult(
        true,
        externalData,
        undefined,
        undefined,
        {
          transformationTime: executionTime,
          fieldsMapped: Object.keys(externalData.EPASubmission).length,
          fieldsSkipped: 0,
          externalVersion: context.externalVersion || 'v2.0',
          internalVersion: '1.0',
        },
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackTransformation(false, executionTime);

      return this.createTransformationResult<unknown>(false, undefined, [
        error instanceof Error
          ? error.message
          : 'EPA external transformation failed',
      ]);
    }
  }

  getSupportedVersions(): string[] {
    return this.supportedVersions;
  }

  // EPA-specific mapping methods
  private mapEPAReportType(epaReportType: string): string {
    const typeMapping: Record<string, string> = {
      'CAA-AirEmissions': 'air_emissions',
      'CWA-WaterDischarge': 'water_discharge',
      'RCRA-WasteManagement': 'waste_management',
      'TSCA-ChemicalReporting': 'chemical_inventory',
    };
    // eslint-disable-next-line security/detect-object-injection
    return typeMapping[epaReportType] || 'general_compliance';
  }

  private mapToEPAReportType(internalType: string): string {
    const typeMapping: Record<string, string> = {
      air_emissions: 'CAA-AirEmissions',
      water_discharge: 'CWA-WaterDischarge',
      waste_management: 'RCRA-WasteManagement',
      chemical_inventory: 'TSCA-ChemicalReporting',
    };
    // eslint-disable-next-line security/detect-object-injection
    return typeMapping[internalType] || 'General-Compliance';
  }

  private mapEPAComplianceStatus(epaStatus: string): string {
    const statusMapping: Record<string, string> = {
      Compliant: 'compliant',
      'Non-Compliant': 'non_compliant',
      Pending: 'pending',
      UnderReview: 'under_review',
    };
    // eslint-disable-next-line security/detect-object-injection
    return statusMapping[epaStatus] || 'unknown';
  }

  private mapToEPAComplianceStatus(internalStatus: string | null): string {
    const statusMapping: Record<string, string> = {
      compliant: 'Compliant',
      non_compliant: 'Non-Compliant',
      partial: 'Partial-Compliance',
      unknown: 'Unknown',
    };
    return statusMapping[internalStatus || 'unknown'] || 'Unknown';
  }
}
