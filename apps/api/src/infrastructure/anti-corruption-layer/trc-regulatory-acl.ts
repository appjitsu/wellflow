import { Injectable } from '@nestjs/common';
import { BaseRegulatoryACL } from './base-regulatory-acl';
import type { RegulatoryReport } from '../../domain/entities/regulatory-report.entity';
import type {
  TransformationContext,
  TransformationResult,
} from './acl.interface';

interface TRCOperatorInfo {
  operatorNumber?: string;
  operatorName?: string;
}

interface TRCLeaseInfo {
  leaseId?: string;
  leaseName?: string;
  district?: string;
  county?: string;
}

interface TRCProductionData {
  oilProduction?: number;
  gasProduction?: number;
  waterProduction?: number;
  condensateProduction?: number;
}

interface TRCSubmissionData {
  operatorInfo?: TRCOperatorInfo;
  leaseInfo?: TRCLeaseInfo;
  productionData?: TRCProductionData;
  wellTests?: unknown;
  complianceInfo?: unknown;
}

interface TRCExternalData {
  operatorNumber?: string;
  operatorName?: string;
  leaseId?: string;
  leaseName?: string;
  district?: string;
  county?: string;
  productionPeriod?: {
    startDate: string;
    endDate: string;
  };
  reportType?: string;
  oilProduction?: number;
  gasProduction?: number;
  waterProduction?: number;
  condensateProduction?: number;
  wellTests?: unknown;
  complianceInfo?: unknown;
  validationStatus?: string;
  complianceStatus?: string;
}

/**
 * Texas Railroad Commission ACL
 * Handles Texas-specific oil and gas regulatory reporting
 */
@Injectable()
export class TRCRegulatoryACL extends BaseRegulatoryACL {
  private readonly supportedVersions = ['v4.0', 'v3.5', 'v3.0'];

  getIdentifier(): string {
    return 'TRC_ACL';
  }

  canHandle(externalSystem: string, version?: string): boolean {
    const supportedSystems = ['trc', 'texas-railroad-commission', 'tx-rrc'];
    if (!supportedSystems.includes(externalSystem.toLowerCase())) return false;

    if (!version) return true;

    return this.supportedVersions.includes(version);
  }

  async transformToDomain<TDomain>(
    externalData: unknown,
    context: TransformationContext,
  ): Promise<TransformationResult<TDomain>> {
    const startTime = Date.now();

    try {
      const validationSchema = {
        requiredFields: ['operatorNumber', 'leaseId', 'productionPeriod'],
        optionalFields: ['oilProduction', 'gasProduction', 'waterProduction'],
        fieldTypes: {
          operatorNumber: 'string',
          leaseId: 'string',
          productionPeriod: 'object',
          oilProduction: 'number',
          gasProduction: 'number',
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

      const trcData = externalData as TRCExternalData;
      const domainData = {
        organizationId: context.userId || 'unknown',
        facilityId: trcData.leaseId,
        regulatoryAgency: 'TRC',
        reportType: this.mapTRCReportType(trcData.reportType || ''),
        reportingPeriodStart: new Date(
          trcData.productionPeriod?.startDate || '',
        ),
        reportingPeriodEnd: new Date(trcData.productionPeriod?.endDate || ''),
        submissionData: {
          operatorInfo: {
            operatorNumber: trcData.operatorNumber,
            operatorName: trcData.operatorName,
          },
          leaseInfo: {
            leaseId: trcData.leaseId,
            leaseName: trcData.leaseName,
            district: trcData.district,
            county: trcData.county,
          },
          productionData: {
            oilProduction: trcData.oilProduction,
            gasProduction: trcData.gasProduction,
            waterProduction: trcData.waterProduction,
            condensateProduction: trcData.condensateProduction,
          },
          wellTests: trcData.wellTests,
          complianceInfo: trcData.complianceInfo,
        },
        validationStatus: trcData.validationStatus || 'pending',
        complianceStatus: this.mapTRCComplianceStatus(
          trcData.complianceStatus || '',
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
          externalVersion: context.externalVersion || 'v4.0',
          internalVersion: '1.0',
        },
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackTransformation(false, executionTime);

      return this.createTransformationResult<TDomain>(false, undefined, [
        error instanceof Error ? error.message : 'TRC transformation failed',
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
      const report = domainData as RegulatoryReport;
      const submissionData = (
        report as RegulatoryReport & {
          submissionData?: TRCSubmissionData;
        }
      ).submissionData;

      const externalData = {
        TRCSubmission: {
          version: context.externalVersion || 'v4.0',
          operatorNumber: submissionData?.operatorInfo?.operatorNumber,
          leaseId: submissionData?.leaseInfo?.leaseId,
          productionPeriod: {
            startDate: report.reportingPeriodStart?.toISOString(),
            endDate: report.reportingPeriodEnd?.toISOString(),
          },
          reportType: this.mapToTRCReportType(
            (report.reportType as { value: string }).value,
          ),
          productionData: submissionData?.productionData,
          complianceStatus: this.mapToTRCComplianceStatus(
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
          fieldsMapped: Object.keys(externalData.TRCSubmission).length,
          fieldsSkipped: 0,
          externalVersion: context.externalVersion || 'v4.0',
          internalVersion: '1.0',
        },
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackTransformation(false, executionTime);

      return this.createTransformationResult<unknown>(false, undefined, [
        error instanceof Error
          ? error.message
          : 'TRC external transformation failed',
      ]);
    }
  }

  getSupportedVersions(): string[] {
    return this.supportedVersions;
  }

  private mapTRCReportType(trcReportType: string): string {
    const typeMapping: Record<string, string> = {
      'PR-ProductionReport': 'monthly_production',
      'WTR-WasteReport': 'waste_management',
      'PLG-PluggingReport': 'well_plugging',
      'INJ-InjectionReport': 'injection_disposal',
    };
    // eslint-disable-next-line security/detect-object-injection
    return typeMapping[trcReportType] || 'general_compliance';
  }

  private mapToTRCReportType(internalType: string): string {
    const typeMapping: Record<string, string> = {
      monthly_production: 'PR-ProductionReport',
      waste_management: 'WTR-WasteReport',
      well_plugging: 'PLG-PluggingReport',
      injection_disposal: 'INJ-InjectionReport',
    };
    // eslint-disable-next-line security/detect-object-injection
    return typeMapping[internalType] || 'General-Compliance';
  }

  private mapTRCComplianceStatus(trcStatus: string): string {
    const statusMapping: Record<string, string> = {
      Compliant: 'compliant',
      'Non-Compliant': 'non_compliant',
      Pending: 'pending',
      'Under Review': 'under_review',
      Violation: 'non_compliant',
    };
    // eslint-disable-next-line security/detect-object-injection
    return statusMapping[trcStatus] || 'unknown';
  }

  private mapToTRCComplianceStatus(internalStatus: string | null): string {
    const statusMapping: Record<string, string> = {
      compliant: 'Compliant',
      non_compliant: 'Non-Compliant',
      partial: 'Partial-Compliance',
      unknown: 'Unknown',
    };
    return statusMapping[internalStatus || 'unknown'] || 'Unknown';
  }
}
