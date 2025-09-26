import { Injectable } from '@nestjs/common';
import { IAggregateFactory, FactoryResult } from './factory.interface';
import { Permit } from '../entities/permit.entity';
import { PermitType } from '../value-objects/permit-type.vo';
import { PermitStatus } from '../value-objects/permit-status.vo';

export interface PermitCreationInput {
  organizationId: string;
  permitNumber: string;
  permitType: string;
  issuingAgency: string;
  regulatoryAuthority?: string;
  wellId?: string;
  facilityId?: string;
  location?: Record<string, unknown>;
  applicationDate?: Date;
  submittedDate?: Date;
  approvalDate?: Date;
  expirationDate?: Date;
  permitConditions?: Record<string, unknown>;
  complianceRequirements?: Record<string, unknown>;
  feeAmount?: number;
  bondAmount?: number;
  bondType?: string;
  documentIds?: string[];
  createdByUserId: string;
}

export interface PermitReconstructionInput {
  id: string;
  organizationId: string;
  permitNumber: string;
  permitType: string;
  issuingAgency: string;
  status: string;
  createdByUserId: string;
  regulatoryAuthority?: string;
  wellId?: string;
  facilityId?: string;
  location?: Record<string, unknown>;
  applicationDate?: Date;
  submittedDate?: Date;
  approvalDate?: Date;
  expirationDate?: Date;
  permitConditions?: Record<string, unknown>;
  complianceRequirements?: Record<string, unknown>;
  feeAmount?: number;
  bondAmount?: number;
  bondType?: string;
  documentIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Permit Factory - implements Factory pattern for creating Permit aggregates
 * Handles complex validation and business rules for permit creation
 */
@Injectable()
export class PermitFactory
  implements IAggregateFactory<PermitCreationInput, Permit>
{
  /**
   * Create a new permit aggregate
   */
  async create(input: PermitCreationInput): Promise<FactoryResult<Permit>> {
    try {
      // Validate input
      const validation = await this.validate(input);
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
        };
      }

      // Create permit type value object
      const permitTypeResult = await this.createPermitType(input.permitType);
      if (!permitTypeResult.success) {
        return {
          success: false,
          errors: [`Permit type error: ${permitTypeResult.errors?.join(', ')}`],
        };
      }

      // At this point, we know permitTypeResult.success is true, so data exists
      const permitType = permitTypeResult.data;
      if (!permitType) {
        return {
          success: false,
          errors: ['Permit type is required but was not provided'],
        };
      }

      // Create permit with validated data
      const permit = Permit.create(
        input.permitNumber,
        permitType,
        input.organizationId,
        input.issuingAgency,
        input.createdByUserId,
      );

      // Apply additional properties if provided
      this.applyOptionalProperties(permit, input);

      return {
        success: true,
        data: permit,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Unknown error during permit creation',
        ],
      };
    }
  }

  /**
   * Apply optional properties to permit
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private applyOptionalProperties(
    permit: Permit,
    input: PermitCreationInput,
  ): void {
    if (input.regulatoryAuthority) {
      permit.regulatoryAuthority = input.regulatoryAuthority;
    }
    if (input.wellId) {
      permit.wellId = input.wellId;
    }
    if (input.facilityId) {
      permit.facilityId = input.facilityId;
    }
    if (input.location) {
      permit.location =
        typeof input.location === 'string'
          ? input.location
          : JSON.stringify(input.location);
    }
    if (input.applicationDate) {
      permit.applicationDate = input.applicationDate;
    }
    if (input.expirationDate) {
      permit.expirationDate = input.expirationDate;
    }
    if (input.permitConditions) {
      permit.permitConditions = input.permitConditions;
    }
    if (input.complianceRequirements) {
      permit.complianceRequirements = input.complianceRequirements;
    }
    if (input.feeAmount) {
      permit.feeAmount = input.feeAmount;
    }
    if (input.bondAmount) {
      permit.bondAmount = input.bondAmount;
    }
    if (input.bondType) {
      permit.bondType = input.bondType;
    }
    if (input.documentIds) {
      permit.documentIds = input.documentIds;
    }
  }

  /**
   * Create permit with default values
   */
  async createWithDefaults(
    input: Partial<PermitCreationInput>,
    defaults: Partial<PermitCreationInput>,
  ): Promise<FactoryResult<Permit>> {
    const mergedInput: PermitCreationInput = {
      organizationId: input.organizationId || defaults.organizationId || '',
      permitNumber: input.permitNumber || defaults.permitNumber || '',
      permitType: input.permitType || defaults.permitType || 'drilling',
      issuingAgency: input.issuingAgency || defaults.issuingAgency || '',
      createdByUserId: input.createdByUserId || defaults.createdByUserId || '',
      ...input, // Override defaults with provided values
    };

    return this.create(mergedInput);
  }

  /**
   * Create permit from existing data (for reconstruction from database)
   */
  async createFromExisting(
    input: PermitCreationInput,
    existingData: Record<string, unknown>,
  ): Promise<FactoryResult<Permit>> {
    // For reconstruction, we need the full state
    const reconstructionInput: PermitReconstructionInput = {
      id: existingData.id as string,
      organizationId: input.organizationId,
      permitNumber: input.permitNumber,
      permitType: input.permitType,
      issuingAgency: input.issuingAgency,
      status: (existingData.status as string) || 'draft',
      createdByUserId: input.createdByUserId,
      ...existingData,
    };

    return this.reconstructFromState(
      reconstructionInput as unknown as Record<string, unknown>,
    );
  }

  /**
   * Create permit with related entities
   */
  async createWithRelated(
    input: PermitCreationInput,
    _relatedData: Record<string, unknown>,
  ): Promise<FactoryResult<Permit>> {
    // Create the permit first
    const result = await this.create(input);
    if (!result.success) {
      return result;
    }

    // Check if related data is provided
    if (_relatedData && Object.keys(_relatedData).length > 0) {
      return {
        success: false,
        errors: ['Related data creation not yet implemented'],
      };
    }

    // NOTE: Future enhancement - Add related entities like permit renewals, responses, etc.
    // This would involve creating related factories and using them here

    return result;
  }

  /**
   * Reconstruct permit from stored state
   */
  async reconstructFromState(
    state: Record<string, unknown>,
  ): Promise<FactoryResult<Permit>> {
    try {
      const input = state as unknown as PermitReconstructionInput;

      // Create permit type and status value objects
      const permitTypeResult = await this.createPermitType(input.permitType);
      if (!permitTypeResult.success) {
        return {
          success: false,
          errors: [`Permit type error: ${permitTypeResult.errors?.join(', ')}`],
        };
      }

      const statusResult = await this.createPermitStatus(input.status);
      if (!statusResult.success) {
        return {
          success: false,
          errors: [`Permit status error: ${statusResult.errors?.join(', ')}`],
        };
      }

      if (!permitTypeResult.data || !statusResult.data) {
        return {
          success: false,
          errors: ['Missing required permit type or status data'],
        };
      }

      // Create permit with existing data
      const permit = new Permit(
        input.id,
        input.permitNumber,
        permitTypeResult.data,
        input.organizationId,
        input.issuingAgency,
        input.createdByUserId,
        statusResult.data,
      );

      // Set additional properties from stored state
      permit.regulatoryAuthority = input.regulatoryAuthority;
      permit.wellId = input.wellId;
      permit.facilityId = input.facilityId;
      if (input.location) {
        permit.location =
          typeof input.location === 'string'
            ? input.location
            : JSON.stringify(input.location);
      }
      permit.applicationDate = input.applicationDate;
      permit.submittedDate = input.submittedDate;
      permit.approvalDate = input.approvalDate;
      permit.expirationDate = input.expirationDate;
      permit.permitConditions = input.permitConditions;
      permit.complianceRequirements = input.complianceRequirements;
      permit.feeAmount = input.feeAmount;
      permit.bondAmount = input.bondAmount;
      permit.bondType = input.bondType;
      permit.documentIds = input.documentIds;
      if (input.createdAt) {
        permit.createdAt = input.createdAt;
      }
      if (input.updatedAt) {
        permit.updatedAt = input.updatedAt;
      }

      return {
        success: true,
        data: permit,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          error instanceof Error
            ? error.message
            : 'Unknown error during permit reconstruction',
        ],
      };
    }
  }

  /**
   * Validate permit creation input
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async validate(input: PermitCreationInput): Promise<{
    isValid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!input.organizationId?.trim()) {
      errors.push('Organization ID is required');
    }

    if (!input.permitNumber?.trim()) {
      errors.push('Permit number is required');
    }

    if (!input.permitType?.trim()) {
      errors.push('Permit type is required');
    }

    if (!input.issuingAgency?.trim()) {
      errors.push('Issuing agency is required');
    }

    if (!input.createdByUserId?.trim()) {
      errors.push('Created by user ID is required');
    }

    // Business rule validation
    if (input.permitNumber && input.permitNumber.length < 3) {
      errors.push('Permit number must be at least 3 characters long');
    }

    if (input.expirationDate && input.expirationDate <= new Date()) {
      errors.push('Expiration date must be in the future');
    }

    if (
      input.applicationDate &&
      input.expirationDate &&
      input.applicationDate >= input.expirationDate
    ) {
      errors.push('Application date must be before expiration date');
    }

    if (input.feeAmount && input.feeAmount < 0) {
      errors.push('Fee amount cannot be negative');
    }

    if (input.bondAmount && input.bondAmount < 0) {
      errors.push('Bond amount cannot be negative');
    }

    // Warnings for missing optional but recommended fields
    if (!input.regulatoryAuthority) {
      warnings.push(
        'Regulatory authority is recommended for complete permit tracking',
      );
    }

    if (!input.expirationDate) {
      warnings.push('Expiration date is recommended for compliance monitoring');
    }

    if (!input.complianceRequirements) {
      warnings.push(
        'Compliance requirements are recommended for regulatory compliance',
      );
    }

    return Promise.resolve({
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  }

  /**
   * Get factory metadata
   */
  getMetadata() {
    return {
      factoryType: 'PermitFactory',
      supportedTypes: ['Permit', 'PermitAggregate'],
      version: '1.0.0',
    };
  }

  // Private helper methods

  private async createPermitType(
    permitTypeString: string,
  ): Promise<FactoryResult<PermitType>> {
    try {
      const permitType = PermitType.fromString(permitTypeString);
      return Promise.resolve({
        success: true,
        data: permitType,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error ? error.message : 'Invalid permit type',
        ],
      });
    }
  }

  private async createPermitStatus(
    statusString: string,
  ): Promise<FactoryResult<PermitStatus>> {
    try {
      const status = PermitStatus.fromString(statusString);
      return Promise.resolve({
        success: true,
        data: status,
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        errors: [
          error instanceof Error ? error.message : 'Invalid permit status',
        ],
      });
    }
  }
}
