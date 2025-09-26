import { Injectable } from '@nestjs/common';
import { BaseRegulatoryACL } from './base-regulatory-acl';
import type { RegulatoryReport } from '../../domain/entities/regulatory-report.entity';
import type {
  TransformationContext,
  TransformationResult,
} from './acl.interface';

interface OSHAEstablishmentInfo {
  name?: string;
  sicCode?: string;
  naicsCode?: string;
  size?: string;
}

interface OSHAWorkforceData {
  totalHoursWorked?: number;
  numberOfEmployees?: number;
}

interface OSHAIncidentData {
  totalRecordableCases?: number;
  lostTimeCases?: number;
  fatalityCases?: number;
  injuryCases?: number;
  illnessCases?: number;
}

interface OSHASubmissionData {
  establishmentInfo?: OSHAEstablishmentInfo;
  workforceData?: OSHAWorkforceData;
  incidentData?: OSHAIncidentData;
}

/**
 * OSHA Anti-Corruption Layer
 * Handles OSHA's injury/illness reporting and safety statistics APIs
 */
@Injectable()
export class OSHARegulatoryACL extends BaseRegulatoryACL {
  private readonly supportedVersions = ['v3.0', 'v2.5', 'v2.0'];

  getIdentifier(): string {
    return 'OSHA_ACL';
  }

  canHandle(externalSystem: string, version?: string): boolean {
    if (externalSystem.toLowerCase() !== 'osha') return false;

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
        requiredFields: ['establishmentName', 'sicCode', 'totalHoursWorked'],
        optionalFields: ['injuryCases', 'illnessCases', 'fatalityCases'],
        fieldTypes: {
          establishmentName: 'string',
          sicCode: 'string',
          totalHoursWorked: 'number',
          injuryCases: 'array',
          illnessCases: 'array',
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

      const oshaData = externalData as {
        establishmentId?: string;
        reportingYear?: number;
        establishmentName?: string;
        sicCode?: string;
        naicsCode?: string;
        establishmentSize?: string;
        totalHoursWorked?: number;
        numberOfEmployees?: number;
        totalRecordableCases?: number;
        lostTimeCases?: number;
        fatalityCases?: number;
        injuryCases?: number;
        illnessCases?: number;
        validationStatus?: string;
      };
      const domainData = {
        organizationId: context.userId || 'unknown',
        facilityId: oshaData.establishmentId || '',
        regulatoryAgency: 'OSHA',
        reportType: 'safety_statistics',
        reportingPeriodStart: new Date(
          oshaData.reportingYear || new Date().getFullYear(),
          0,
          1,
        ),
        reportingPeriodEnd: new Date(
          oshaData.reportingYear || new Date().getFullYear(),
          11,
          31,
        ),
        submissionData: {
          establishmentInfo: {
            name: oshaData.establishmentName,
            sicCode: oshaData.sicCode,
            naicsCode: oshaData.naicsCode,
            size: oshaData.establishmentSize,
          },
          workforceData: {
            totalHoursWorked: oshaData.totalHoursWorked,
            numberOfEmployees: oshaData.numberOfEmployees,
          },
          incidentData: {
            totalRecordableCases: oshaData.totalRecordableCases,
            lostTimeCases: oshaData.lostTimeCases,
            fatalityCases: oshaData.fatalityCases,
            injuryCases: oshaData.injuryCases,
            illnessCases: oshaData.illnessCases,
          },
        },
        validationStatus: oshaData.validationStatus || 'pending',
        complianceStatus: this.calculateOSHACompliance(oshaData),
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
          externalVersion: context.externalVersion || 'v3.0',
          internalVersion: '1.0',
        },
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackTransformation(false, executionTime);

      return this.createTransformationResult<TDomain>(false, undefined, [
        error instanceof Error ? error.message : 'OSHA transformation failed',
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
          submissionData?: OSHASubmissionData;
        }
      ).submissionData;

      const externalData = {
        OSHASubmission: {
          version: context.externalVersion || 'v3.0',
          establishmentId: report.organizationId,
          reportingYear:
            report.reportingPeriodStart?.getFullYear() ||
            new Date().getFullYear(),
          establishmentInfo: {
            name:
              submissionData?.establishmentInfo?.name ||
              'Unknown Establishment',
            sicCode: submissionData?.establishmentInfo?.sicCode || '0000',
            naicsCode: submissionData?.establishmentInfo?.naicsCode || '000000',
          },
          workforceData: {
            totalHoursWorked:
              submissionData?.workforceData?.totalHoursWorked || 0,
            numberOfEmployees:
              submissionData?.workforceData?.numberOfEmployees || 0,
          },
          incidentData: {
            totalRecordableCases:
              submissionData?.incidentData?.totalRecordableCases || 0,
            lostTimeCases: submissionData?.incidentData?.lostTimeCases || 0,
            fatalityCases: submissionData?.incidentData?.fatalityCases || 0,
            injuryCases: submissionData?.incidentData?.injuryCases || 0,
            illnessCases: submissionData?.incidentData?.illnessCases || 0,
          },
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
          fieldsMapped: Object.keys(externalData.OSHASubmission).length,
          fieldsSkipped: 0,
          externalVersion: context.externalVersion || 'v3.0',
          internalVersion: '1.0',
        },
      );
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.trackTransformation(false, executionTime);

      return this.createTransformationResult<unknown>(false, undefined, [
        error instanceof Error
          ? error.message
          : 'OSHA external transformation failed',
      ]);
    }
  }

  getSupportedVersions(): string[] {
    return this.supportedVersions;
  }

  private calculateOSHACompliance(oshaData: {
    totalRecordableCases?: number;
    lostTimeCases?: number;
    fatalityCases?: number;
  }): string {
    // OSHA compliance is based on injury/illness rates and reporting compliance
    const totalCases =
      (oshaData.totalRecordableCases || 0) +
      (oshaData.lostTimeCases || 0) +
      (oshaData.fatalityCases || 0);

    // Simple compliance calculation - in real implementation this would be more sophisticated
    if (totalCases === 0) return 'compliant';
    if (totalCases <= 5) return 'compliant';
    if (totalCases <= 10) return 'partial';
    return 'non_compliant';
  }
}
