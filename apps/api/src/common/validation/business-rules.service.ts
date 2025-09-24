import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { eq, and, sql } from 'drizzle-orm';
import {
  wells,
  productionRecords,
  leasePartners,
  leases,
} from '../../database/schema';

/**
 * Business Rule Validation Result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * API Number Validation Result
 */
export interface ApiNumberValidationResult extends ValidationResult {
  stateCode?: string;
  countyCode?: string;
  wellSequence?: string;
}

/**
 * Production Data Validation Context
 */
export interface ProductionValidationContext {
  wellId: string;
  productionDate: Date;
  oilVolume?: number;
  gasVolume?: number;
  waterVolume?: number;
  organizationId: string;
}

/**
 * Lease Partner Validation Context
 */
export interface LeasePartnerValidationContext {
  leaseId: string;
  partnerId: string;
  workingInterestPercent: number;
  royaltyInterestPercent: number;
  netRevenueInterestPercent: number;
  effectiveDate: Date;
  endDate?: Date;
  organizationId: string;
}

/**
 * Business Rule Validation Service
 *
 * Centralized service for complex business rule validation that spans multiple entities.
 * Follows Single Responsibility Principle by focusing solely on business rule validation.
 */
@Injectable()
export class BusinessRulesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Validates API number format and business rules
   *
   * @param apiNumber - 14-digit API number to validate
   * @param organizationId - Organization ID for uniqueness check
   * @returns Validation result with detailed information
   */
  async validateApiNumber(
    apiNumber: string,
    organizationId: string,
    excludeWellId?: string,
  ): Promise<ApiNumberValidationResult> {
    const result: ApiNumberValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Format validation
    if (!/^\d{14}$/.test(apiNumber)) {
      result.isValid = false;
      result.errors.push('API number must be exactly 14 digits');
      return result;
    }

    // Extract components
    const stateCode = apiNumber.substring(0, 2);
    const countyCode = apiNumber.substring(2, 5);
    const wellSequence = apiNumber.substring(5);

    result.stateCode = stateCode;
    result.countyCode = countyCode;
    result.wellSequence = wellSequence;

    // State code validation (01-99)
    const stateCodeNum = parseInt(stateCode);
    if (stateCodeNum < 1 || stateCodeNum > 99) {
      result.isValid = false;
      result.errors.push('State code must be between 01 and 99');
    }

    // County code validation (001-999)
    const countyCodeNum = parseInt(countyCode);
    if (countyCodeNum < 1 || countyCodeNum > 999) {
      result.isValid = false;
      result.errors.push('County code must be between 001 and 999');
    }

    // Uniqueness check within organization
    try {
      const existingWell = await this.db.db
        .select({ id: wells.id })
        .from(wells)
        .where(
          and(
            eq(wells.apiNumber, apiNumber),
            eq(wells.organizationId, organizationId),
            excludeWellId ? sql`${wells.id} != ${excludeWellId}` : undefined,
          ),
        )
        .limit(1);

      if (existingWell.length > 0) {
        result.isValid = false;
        result.errors.push('API number already exists in this organization');
      }
    } catch (error) {
      console.warn('Could not verify API number uniqueness:', error);
      result.warnings.push('Could not verify API number uniqueness');
    }

    return result;
  }

  /**
   * Validates production data business rules
   *
   * @param context - Production validation context
   * @returns Validation result
   */
  async validateProductionData(
    context: ProductionValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate required fields
    if (!context.productionDate) {
      result.isValid = false;
      result.errors.push('Production date is required');
      return result;
    }

    await this.validateWellExistenceAndStatus(context, result);
    if (!result.isValid) return result;

    await this.validateDuplicateProductionRecords(context, result);
    if (!result.isValid) return result;

    this.validateProductionDate(context, result);
    this.validateProductionVolumes(context, result);

    return result;
  }

  /**
   * Validates well existence and status for production data
   */
  private async validateWellExistenceAndStatus(
    context: ProductionValidationContext,
    result: ValidationResult,
  ): Promise<void> {
    try {
      const well = await this.db.db
        .select({ status: wells.status, wellType: wells.wellType })
        .from(wells)
        .where(
          and(
            eq(wells.id, context.wellId),
            eq(wells.organizationId, context.organizationId),
          ),
        )
        .limit(1);

      if (well.length === 0) {
        result.isValid = false;
        result.errors.push('Well not found or not accessible');
        return;
      }

      const wellData = well[0];
      if (!wellData) {
        result.isValid = false;
        result.errors.push('Well data is invalid');
        return;
      }

      this.validateWellStatus(wellData, result);
      this.validateWellTypeProductionVolumes(wellData, context, result);
    } catch (error) {
      console.warn('Could not validate well information:', error);
      result.warnings.push('Could not validate well information');
    }
  }

  /**
   * Validates well status for production
   */
  private validateWellStatus(
    wellData: { status: string; wellType: string },
    result: ValidationResult,
  ): void {
    if (wellData.status !== 'active') {
      result.warnings.push(
        `Well status is ${wellData.status}, production data may not be accurate`,
      );
    }
  }

  /**
   * Validates production volumes based on well type
   */
  private validateWellTypeProductionVolumes(
    wellData: { status: string; wellType: string },
    context: ProductionValidationContext,
    result: ValidationResult,
  ): void {
    if (
      wellData.wellType === 'OIL' &&
      context.gasVolume &&
      context.gasVolume > (context.oilVolume || 0) * 10
    ) {
      result.warnings.push('Gas volume seems high for an oil well');
    }

    if (
      wellData.wellType === 'GAS' &&
      context.oilVolume &&
      context.oilVolume > 0
    ) {
      result.warnings.push('Oil volume reported for a gas well');
    }
  }

  /**
   * Validates for duplicate production records
   */
  private async validateDuplicateProductionRecords(
    context: ProductionValidationContext,
    result: ValidationResult,
  ): Promise<void> {
    try {
      const productionDateString = context.productionDate
        .toISOString()
        .split('T')[0];
      if (!productionDateString) {
        throw new Error('Invalid production date');
      }

      const existingRecord = await this.db.db
        .select({ id: productionRecords.id })
        .from(productionRecords)
        .where(
          and(
            eq(productionRecords.wellId, context.wellId),
            eq(productionRecords.productionDate, productionDateString),
          ),
        )
        .limit(1);

      if (existingRecord.length > 0) {
        result.isValid = false;
        result.errors.push(
          'Production record already exists for this well and date',
        );
      }
    } catch (error) {
      console.warn('Could not check for duplicate production records:', error);
      result.warnings.push('Could not check for duplicate production records');
    }
  }

  /**
   * Validates production date constraints
   */
  private validateProductionDate(
    context: ProductionValidationContext,
    result: ValidationResult,
  ): void {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    if (context.productionDate > today) {
      result.isValid = false;
      result.errors.push('Production date cannot be in the future');
    }

    if (context.productionDate < oneYearAgo) {
      result.warnings.push('Production date is more than one year old');
    }
  }

  /**
   * Validates production volume reasonableness
   */
  private validateProductionVolumes(
    context: ProductionValidationContext,
    result: ValidationResult,
  ): void {
    const maxOilVolume = 10000; // barrels per day
    const maxGasVolume = 100000; // MCF per day
    const maxWaterVolume = 50000; // barrels per day

    if (context.oilVolume && context.oilVolume > maxOilVolume) {
      result.warnings.push(
        `Oil volume (${context.oilVolume}) exceeds typical maximum (${maxOilVolume} barrels)`,
      );
    }

    if (context.gasVolume && context.gasVolume > maxGasVolume) {
      result.warnings.push(
        `Gas volume (${context.gasVolume}) exceeds typical maximum (${maxGasVolume} MCF)`,
      );
    }

    if (context.waterVolume && context.waterVolume > maxWaterVolume) {
      result.warnings.push(
        `Water volume (${context.waterVolume}) exceeds typical maximum (${maxWaterVolume} barrels)`,
      );
    }
  }

  /**
   * Validates lease partner ownership percentages
   *
   * @param context - Lease partner validation context
   * @returns Validation result
   */
  async validateLeasePartnerOwnership(
    context: LeasePartnerValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Validate percentage relationships
    // Working Interest >= Net Revenue Interest
    if (context.workingInterestPercent < context.netRevenueInterestPercent) {
      result.isValid = false;
      result.errors.push(
        'Working interest percentage must be greater than or equal to net revenue interest percentage',
      );
    }

    // Check total working interest doesn't exceed 100%
    try {
      const existingPartners = await this.db.db
        .select({
          workingInterestPercent: leasePartners.workingInterestPercent,
          partnerId: leasePartners.partnerId,
        })
        .from(leasePartners)
        .where(
          and(
            eq(leasePartners.leaseId, context.leaseId),
            sql`${leasePartners.partnerId} != ${context.partnerId}`,
            sql`${leasePartners.effectiveDate} <= ${context.effectiveDate}`,
            sql`(${leasePartners.endDate} IS NULL OR ${leasePartners.endDate} >= ${context.effectiveDate})`,
          ),
        );

      const totalExistingWI = existingPartners.reduce(
        (sum, partner) =>
          sum + parseFloat(partner.workingInterestPercent || '0'),
        0,
      );

      const newTotal = totalExistingWI + context.workingInterestPercent;

      if (newTotal > 1.0001) {
        // Allow for small floating point errors
        result.isValid = false;
        result.errors.push(
          `Total working interest would exceed 100% (current: ${(newTotal * 100).toFixed(2)}%)`,
        );
      }

      if (newTotal > 1 && newTotal <= 1.0001) {
        result.warnings.push('Total working interest is exactly 100%');
      }
    } catch (error) {
      console.warn(
        'Could not validate total working interest percentages:',
        error,
      );
      result.warnings.push(
        'Could not validate total working interest percentages',
      );
    }

    return result;
  }

  /**
   * Validates that a lease exists and is accessible
   *
   * @param leaseId - Lease ID to validate
   * @param organizationId - Organization ID for access check
   * @returns Validation result
   */
  async validateLeaseAccess(
    leaseId: string,
    organizationId: string,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      const lease = await this.db.db
        .select({ status: leases.status })
        .from(leases)
        .where(
          and(
            eq(leases.id, leaseId),
            eq(leases.organizationId, organizationId),
          ),
        )
        .limit(1);

      if (lease.length === 0) {
        result.isValid = false;
        result.errors.push('Lease not found or not accessible');
        return result;
      }

      const leaseData = lease[0];
      if (!leaseData) {
        result.isValid = false;
        result.errors.push('Lease data is invalid');
        return result;
      }

      if (leaseData.status === 'expired') {
        result.warnings.push('Lease has expired');
      } else if (leaseData.status === 'terminated') {
        result.warnings.push('Lease has been terminated');
      }
    } catch (error) {
      console.warn('Could not validate lease access:', error);
      result.isValid = false;
      result.errors.push('Could not validate lease access');
    }

    return result;
  }
}
