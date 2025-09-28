import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  IRegulatoryACLManager,
  IAntiCorruptionLayer,
  TransformationContext,
  TransformationResult,
  ACLStatistics,
  ValidationSchema,
} from './acl.interface';
import {
  EPARegulatoryACL,
  OSHARegulatoryACL,
  TRCRegulatoryACL,
} from './regulatory-acls';
import type { RegulatoryReport } from '../../domain/entities/regulatory-report.entity';

/**
 * Agency code mappings for different regulatory bodies
 */
const AGENCY_CODE_MAPPINGS: Record<string, string[]> = {
  EPA: ['epa', 'environmental protection agency', 'us-epa'],
  OSHA: ['osha', 'occupational safety and health administration', 'us-osha'],
  TRC: [
    'trc',
    'texas railroad commission',
    'tx-rrc',
    'texas-railroad-commission',
  ],
  NMOCD: ['nmocd', 'new mexico oil conservation division', 'nm-ocd'],
  COGCC: ['cogcc', 'colorado oil and gas conservation commission', 'co-gcc'],
  WOGCC: ['wogcc', 'wyoming oil and gas conservation commission', 'wy-gcc'],
  NDIC: ['ndic', 'north dakota industrial commission', 'nd-ic'],
};

/**
 * Regulatory ACL Manager Service
 * Manages Anti-Corruption Layers for different regulatory agencies
 * Provides unified interface for regulatory data transformations
 */
@Injectable()
export class RegulatoryACLManagerService
  implements IRegulatoryACLManager, OnModuleInit
{
  private readonly logger = new Logger(RegulatoryACLManagerService.name);

  // ACL registry
  private readonly acls = new Map<string, IAntiCorruptionLayer>();
  private readonly agencyToACLMapping = new Map<string, string>();

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit(): Promise<void> {
    await this.initializeACLs();
  }

  /**
   * Initialize all regulatory ACLs
   */
  private async initializeACLs(): Promise<void> {
    try {
      // Initialize EPA ACL
      const epaAcl = await this.moduleRef.create(EPARegulatoryACL);
      this.registerACL(epaAcl);
      for (const code of AGENCY_CODE_MAPPINGS.EPA || []) {
        this.agencyToACLMapping.set(code, epaAcl.getIdentifier());
      }

      // Initialize OSHA ACL
      const oshaAcl = await this.moduleRef.create(OSHARegulatoryACL);
      this.registerACL(oshaAcl);
      for (const code of AGENCY_CODE_MAPPINGS.OSHA || []) {
        this.agencyToACLMapping.set(code, oshaAcl.getIdentifier());
      }

      // Initialize TRC ACL
      const trcAcl = await this.moduleRef.create(TRCRegulatoryACL);
      this.registerACL(trcAcl);
      for (const code of AGENCY_CODE_MAPPINGS.TRC || []) {
        this.agencyToACLMapping.set(code, trcAcl.getIdentifier());
      }

      // NOTE: Future enhancement - Initialize other state agency ACLs as needed

      // const nmocdAcl = await this.moduleRef.create(NMOCDRegulatoryACL);
      // const cogccAcl = await this.moduleRef.create(COGCCRegulatoryACL);
      // etc.

      this.logger.log(`Initialized ${this.acls.size} regulatory ACLs`);

      this.logACLStatistics();
    } catch (error) {
      this.logger.error('Failed to initialize ACLs:', error);
      throw error;
    }
  }

  /**
   * Get ACL for specific agency
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getACLForAgency(
    agencyCode: string,
    version?: string,
  ): Promise<IAntiCorruptionLayer> {
    const normalizedCode = agencyCode.toLowerCase().trim();
    const aclIdentifier = this.agencyToACLMapping.get(normalizedCode);

    if (!aclIdentifier) {
      throw new Error(`No ACL found for agency code: ${agencyCode}`);
    }

    const acl = this.acls.get(aclIdentifier);
    if (!acl) {
      throw new Error(`ACL not found: ${aclIdentifier}`);
    }

    // Check if ACL can handle the requested version
    if (version && !acl.canHandle(agencyCode, version)) {
      throw new Error(
        `ACL ${aclIdentifier} does not support version ${version} for agency ${agencyCode}`,
      );
    }

    return acl;
  }

  /**
   * Register custom ACL
   */
  registerACL(acl: IAntiCorruptionLayer): void {
    const identifier = acl.getIdentifier();

    if (this.acls.has(identifier)) {
      this.logger.warn(`ACL ${identifier} already registered, replacing`);
    }

    this.acls.set(identifier, acl);
    this.logger.debug(`Registered ACL: ${identifier}`);
  }

  /**
   * Transform regulatory data for external submission
   */
  async transformForSubmission(
    report: RegulatoryReport,
    agencyCode: string,
    version?: string,
  ): Promise<TransformationResult<unknown>> {
    const acl = await this.getACLForAgency(agencyCode, version);

    const context: TransformationContext = {
      operation: 'export',
      entityType: 'RegulatoryReport',
      externalSystem: agencyCode,
      externalVersion: version,
      userId: report.generatedByUserId,
      correlationId: `submission-${report.id}-${Date.now()}`,
      metadata: {
        reportId: report.id,
        organizationId: report.organizationId,
        reportType: report.reportType.value,
      },
    };

    return acl.transformToExternal(report, context);
  }

  /**
   * Transform external response to internal format
   */
  async transformSubmissionResponse(
    externalResponse: unknown,
    agencyCode: string,
    version?: string,
    userId?: string,
  ): Promise<TransformationResult<unknown>> {
    const acl = await this.getACLForAgency(agencyCode, version);

    const context: TransformationContext = {
      operation: 'import',
      entityType: 'SubmissionResponse',
      externalSystem: agencyCode,
      externalVersion: version,
      userId: userId || 'system',
      correlationId: `response-${Date.now()}`,
      metadata: {
        responseType: 'submission_acknowledgment',
      },
    };

    return acl.transformToDomain(externalResponse, context);
  }

  /**
   * Transform external regulatory data to internal domain format
   */
  async transformExternalData<TDomain>(
    externalData: unknown,
    agencyCode: string,
    entityType: string = 'RegulatoryReport',
    version?: string,
    userId?: string,
  ): Promise<TransformationResult<TDomain>> {
    const acl = await this.getACLForAgency(agencyCode, version);

    const context: TransformationContext = {
      operation: 'import',
      entityType,
      externalSystem: agencyCode,
      externalVersion: version,
      userId: userId || 'system',
      correlationId: `import-${Date.now()}`,
    };

    return acl.transformToDomain<TDomain>(externalData, context);
  }

  /**
   * Get ACL statistics across all agencies
   */
  getAllACLStatistics(): Record<string, ACLStatistics> {
    const stats: Record<string, ACLStatistics> = {};

    for (const [identifier, acl] of this.acls.entries()) {
      // eslint-disable-next-line security/detect-object-injection
      stats[identifier] = acl.getStatistics();
    }

    return stats;
  }

  /**
   * Get supported agencies
   */
  getSupportedAgencies(): string[] {
    return Array.from(this.agencyToACLMapping.keys());
  }

  /**
   * Get ACL for specific agency code (cached lookup)
   */
  getACLByAgencyCode(agencyCode: string): IAntiCorruptionLayer | undefined {
    const normalizedCode = agencyCode.toLowerCase().trim();
    const aclIdentifier = this.agencyToACLMapping.get(normalizedCode);

    if (!aclIdentifier) {
      return undefined;
    }

    return this.acls.get(aclIdentifier);
  }

  /**
   * Validate external data for a specific agency
   */
  async validateExternalData(
    externalData: unknown,
    agencyCode: string,
    version?: string,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    aclUsed?: string;
  }> {
    try {
      const acl = await this.getACLForAgency(agencyCode, version);

      // Use a basic schema for validation - in real implementation this would be more sophisticated
      const schema: ValidationSchema = {
        requiredFields: ['organizationId', 'reportType'],
        optionalFields: [
          'facilityId',
          'reportingPeriodStart',
          'reportingPeriodEnd',
        ],
        fieldTypes: {
          organizationId: 'string',
          reportType: 'string',
          facilityId: 'string',
        },
      };

      const validation = await acl.validateExternalData(externalData, schema);

      return {
        isValid: validation.isValid,
        errors: validation.errors.map((e) => e.message),
        warnings: validation.warnings.map((w) => w.message),
        aclUsed: acl.getIdentifier(),
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          error instanceof Error ? error.message : 'ACL validation failed',
        ],
        warnings: [],
      };
    }
  }

  /**
   * Get transformation capabilities for an agency
   */
  async getAgencyCapabilities(agencyCode: string): Promise<{
    supported: boolean;
    versions: string[];
    aclIdentifier?: string;
    capabilities?: string[];
  }> {
    try {
      const acl = await this.getACLForAgency(agencyCode);

      return {
        supported: true,
        versions: acl.getSupportedVersions(),
        aclIdentifier: acl.getIdentifier(),
        capabilities: [
          'transform_to_domain',
          'transform_to_external',
          'validate_external_data',
          'submission_formatting',
        ],
      };
    } catch (_error) {
      this.logger.warn('Error checking ACL capabilities', _error);
      return {
        supported: false,
        versions: [],
      };
    }
  }

  /**
   * Batch transform multiple reports for different agencies
   */
  async batchTransformForSubmission(
    reports: Array<{
      report: RegulatoryReport;
      agencyCode: string;
      version?: string;
    }>,
  ): Promise<Array<TransformationResult<unknown>>> {
    const promises = reports.map(async ({ report, agencyCode, version }) => {
      try {
        return await this.transformForSubmission(report, agencyCode, version);
      } catch (error) {
        return {
          success: false,
          errors: [
            error instanceof Error
              ? error.message
              : 'Batch transformation failed',
          ],
        };
      }
    });

    return Promise.all(promises);
  }

  /**
   * Health check for ACL system
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async healthCheck(): Promise<{
    healthy: boolean;
    totalACLs: number;
    supportedAgencies: number;
    aclErrors: string[];
    transformationStats: {
      totalTransformations: number;
      averageSuccessRate: number;
    };
  }> {
    const acls = Array.from(this.acls.values());
    const aclErrors: string[] = [];

    // Check each ACL for basic functionality
    for (const acl of acls) {
      try {
        const stats = acl.getStatistics();
        if (stats.errorRate > 50) {
          aclErrors.push(
            `${acl.getIdentifier()}: High error rate (${stats.errorRate.toFixed(1)}%)`,
          );
        }
      } catch (error) {
        aclErrors.push(
          `${acl.getIdentifier()}: ${error instanceof Error ? error.message : 'Health check failed'}`,
        );
      }
    }

    // Calculate transformation statistics
    const allStats = this.getAllACLStatistics();
    const totalTransformations = Object.values(allStats).reduce(
      (sum, stats) => sum + stats.totalTransformations,
      0,
    );
    const totalSuccessful = Object.values(allStats).reduce(
      (sum, stats) => sum + stats.successfulTransformations,
      0,
    );
    const averageSuccessRate =
      totalTransformations > 0
        ? (totalSuccessful / totalTransformations) * 100
        : 100;

    return {
      healthy: aclErrors.length === 0,
      totalACLs: acls.length,
      supportedAgencies: this.agencyToACLMapping.size,
      aclErrors,
      transformationStats: {
        totalTransformations,
        averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
      },
    };
  }

  /**
   * Log ACL statistics
   */
  private logACLStatistics(): void {
    const stats = this.getAllACLStatistics();
    const totalTransformations = Object.values(stats).reduce(
      (sum, aclStats) => sum + aclStats.totalTransformations,
      0,
    );

    this.logger.log('Regulatory ACL Statistics:', {
      totalACLs: this.acls.size,
      supportedAgencies: this.agencyToACLMapping.size,
      totalTransformations,
      aclDetails: Object.entries(stats).map(([id, aclStats]) => ({
        acl: id,
        transformations: aclStats.totalTransformations,
        successRate:
          aclStats.totalTransformations > 0
            ? (
                (aclStats.successfulTransformations /
                  aclStats.totalTransformations) *
                100
              ).toFixed(1) + '%'
            : 'N/A',
        averageTime: aclStats.averageTransformationTime.toFixed(2) + 'ms',
      })),
    });
  }

  /**
   * Get ACL registry information
   */
  getRegistryInfo(): {
    registeredACLs: string[];
    agencyMappings: Record<string, string>;
    supportedVersions: Record<string, string[]>;
  } {
    const agencyMappings: Record<string, string> = {};
    for (const [agency, aclId] of this.agencyToACLMapping.entries()) {
      // eslint-disable-next-line security/detect-object-injection
      agencyMappings[agency] = aclId;
    }

    const supportedVersions: Record<string, string[]> = {};
    for (const [aclId, acl] of this.acls.entries()) {
      // eslint-disable-next-line security/detect-object-injection
      supportedVersions[aclId] = acl.getSupportedVersions();
    }

    return {
      registeredACLs: Array.from(this.acls.keys()),
      agencyMappings,
      supportedVersions,
    };
  }
}
