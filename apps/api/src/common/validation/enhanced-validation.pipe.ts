import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AuditLogService } from '../../application/services/audit-log.service';
import { AuditResourceType } from '../../domain/entities/audit-log.entity';

export interface ValidationContext {
  userId?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  sanitizedData: any;
}

/**
 * Enhanced Validation Pipe
 * Provides comprehensive request validation with:
 * - Standard class-validator integration
 * - Domain-specific business rules
 * - Security validations
 * - Audit logging
 * - Data sanitization
 */
@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(EnhancedValidationPipe.name);

  constructor(
    @Optional() private readonly auditLogService?: AuditLogService,
  ) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const { metatype } = metadata;
    if (!metatype || !this.isClass(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, value);

    // Perform comprehensive validation
    const validationResult = await this.validateComprehensive(object, metadata);

    // Log validation results if there are issues
    if (!validationResult.isValid || validationResult.warnings.length > 0) {
      await this.logValidationResult(validationResult, metadata);
    }

    if (!validationResult.isValid) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: this.formatValidationErrors(validationResult.errors),
        warnings: validationResult.warnings,
      });
    }

    // Return sanitized data
    return validationResult.sanitizedData;
  }

  private async validateComprehensive(
    object: any,
    metadata: ArgumentMetadata,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // 1. Standard class-validator validation
    const classValidatorErrors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });
    errors.push(...classValidatorErrors);

    // 2. Domain-specific validation
    const domainValidation = await this.validateDomainRules(object, metadata);
    errors.push(...domainValidation.errors);
    warnings.push(...domainValidation.warnings);

    // 3. Security validation
    const securityValidation = await this.validateSecurityRules(object, metadata);
    errors.push(...securityValidation.errors);
    warnings.push(...securityValidation.warnings);

    // 4. Business rule validation
    const businessValidation = await this.validateBusinessRules(object, metadata);
    errors.push(...businessValidation.errors);
    warnings.push(...businessValidation.warnings);

    // 5. Data sanitization
    const sanitizedData = await this.sanitizeData(object, metadata);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData,
    };
  }

  private async validateDomainRules(object: any, metadata: ArgumentMetadata): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const className = metadata.metatype?.name;

    switch (className) {
      case 'CreateWellDto':
        await this.validateWellCreation(object, errors, warnings);
        break;
      case 'UpdateWellDto':
        await this.validateWellUpdate(object, errors, warnings);
        break;
      case 'CreateLeaseDto':
        await this.validateLeaseCreation(object, errors, warnings);
        break;
      case 'CreateProductionDto':
        await this.validateProductionData(object, errors, warnings);
        break;
    }

    return { isValid: errors.length === 0, errors, warnings, sanitizedData: object };
  }

  private async validateSecurityRules(object: any, metadata: ArgumentMetadata): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(-{2}|\/\*|\*\/)/, // SQL comments
      /('|(\\x27)|(\\x2D))/, // Quotes and dashes
    ];

    const objectString = JSON.stringify(object);
    sqlInjectionPatterns.forEach(pattern => {
      if (pattern.test(objectString)) {
        warnings.push('Potential SQL injection pattern detected');
      }
    });

    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(objectString)) {
        warnings.push('Potential XSS pattern detected');
      }
    });

    // Check for sensitive data exposure
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    sensitiveFields.forEach(field => {
      if (object[field]) {
        errors.push({
          target: object,
          property: field,
          value: object[field],
          constraints: {
            sensitiveData: 'Sensitive data should not be included in request body',
          },
        } as ValidationError);
      }
    });

    return { isValid: errors.length === 0, errors, warnings, sanitizedData: object };
  }

  private async validateBusinessRules(object: any, metadata: ArgumentMetadata): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const className = metadata.metatype?.name;

    // Add business rule validations here
    switch (className) {
      case 'CreateWellDto':
        // Business rule: Well API number must be unique
        // Business rule: Well location must be within operational area
        break;
      case 'CreateProductionDto':
        // Business rule: Production dates must be in the past
        // Business rule: Volumes must be reasonable for well type
        break;
    }

    return { isValid: errors.length === 0, errors, warnings, sanitizedData: object };
  }

  private async sanitizeData(object: any, metadata: ArgumentMetadata): Promise<any> {
    const sanitized = { ...object };

    // Trim string fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    // Sanitize HTML content if present
    const htmlFields = ['description', 'notes', 'comments'];
    htmlFields.forEach(field => {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        // Basic HTML sanitization - remove script tags, etc.
        sanitized[field] = sanitized[field]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '');
      }
    });

    // Normalize email addresses
    if (sanitized.email && typeof sanitized.email === 'string') {
      sanitized.email = sanitized.email.toLowerCase();
    }

    return sanitized;
  }

  private async validateWellCreation(object: any, errors: ValidationError[], warnings: string[]): Promise<void> {
    // Validate API number format (14 digits)
    if (object.apiNumber && !/^\d{14}$/.test(object.apiNumber)) {
      errors.push({
        target: object,
        property: 'apiNumber',
        value: object.apiNumber,
        constraints: {
          apiNumberFormat: 'API number must be exactly 14 digits',
        },
      } as ValidationError);
    }

    // Validate coordinates are within reasonable bounds
    if (object.location?.coordinates) {
      const { latitude, longitude } = object.location.coordinates;
      if (latitude < -90 || latitude > 90) {
        errors.push({
          target: object,
          property: 'location.coordinates.latitude',
          value: latitude,
          constraints: {
            coordinateRange: 'Latitude must be between -90 and 90 degrees',
          },
        } as ValidationError);
      }
      if (longitude < -180 || longitude > 180) {
        errors.push({
          target: object,
          property: 'location.coordinates.longitude',
          value: longitude,
          constraints: {
            coordinateRange: 'Longitude must be between -180 and 180 degrees',
          },
        } as ValidationError);
      }
    }

    // Validate well type is valid
    const validWellTypes = ['OIL', 'GAS', 'WATER', 'INJECTION', 'OBSERVATION', 'DRY_HOLE'];
    if (object.wellType && !validWellTypes.includes(object.wellType)) {
      warnings.push(`Well type '${object.wellType}' is not in the standard list`);
    }
  }

  private async validateWellUpdate(object: any, errors: ValidationError[], warnings: string[]): Promise<void> {
    // Similar validations but for updates
    // Could add additional rules for what can be updated
  }

  private async validateLeaseCreation(object: any, errors: ValidationError[], warnings: string[]): Promise<void> {
    // Validate lease dates
    if (object.effectiveDate && object.expirationDate) {
      const effective = new Date(object.effectiveDate);
      const expiration = new Date(object.expirationDate);

      if (expiration <= effective) {
        errors.push({
          target: object,
          property: 'expirationDate',
          value: object.expirationDate,
          constraints: {
            dateOrder: 'Expiration date must be after effective date',
          },
        } as ValidationError);
      }
    }

    // Validate royalty rate is reasonable (0-50%)
    if (object.royaltyRate !== undefined) {
      if (object.royaltyRate < 0 || object.royaltyRate > 0.5) {
        errors.push({
          target: object,
          property: 'royaltyRate',
          value: object.royaltyRate,
          constraints: {
            royaltyRange: 'Royalty rate must be between 0% and 50%',
          },
        } as ValidationError);
      }
    }
  }

  private async validateProductionData(object: any, errors: ValidationError[], warnings: string[]): Promise<void> {
    // Validate production date is not in the future
    if (object.productionDate) {
      const prodDate = new Date(object.productionDate);
      const now = new Date();

      if (prodDate > now) {
        errors.push({
          target: object,
          property: 'productionDate',
          value: object.productionDate,
          constraints: {
            futureDate: 'Production date cannot be in the future',
          },
        } as ValidationError);
      }

      // Warn if production date is very old
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      if (prodDate < oneYearAgo) {
        warnings.push('Production date is more than a year old');
      }
    }

    // Validate volumes are reasonable
    const volumeFields = ['oilVolume', 'gasVolume', 'waterVolume'];
    volumeFields.forEach(field => {
      if (object[field] !== undefined) {
        if (object[field] < 0) {
          errors.push({
            target: object,
            property: field,
            value: object[field],
            constraints: {
              positiveVolume: `${field} cannot be negative`,
            },
          } as ValidationError);
        }

        // Warn for unusually high volumes
        if (object[field] > 10000) {
          warnings.push(`${field} seems unusually high: ${object[field]}`);
        }
      }
    });
  }

  private formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map(error => ({
      field: error.property,
      value: error.value,
      constraints: error.constraints,
      children: error.children?.map(child => this.formatValidationErrors([child])[0]),
    }));
  }

  private async logValidationResult(result: ValidationResult, metadata: ArgumentMetadata): Promise<void> {
    if (!this.auditLogService) return;

    const className = metadata.metatype?.name || 'Unknown';

    if (!result.isValid) {
      await this.auditLogService.logAction(
        'EXECUTE',
        AuditResourceType.SYSTEM,
        `validation-failed-${className}`,
        false,
        `Validation failed for ${className}: ${result.errors.length} errors`,
        {},
        {
          validationErrors: result.errors.map(e => ({
            field: e.property,
            constraints: e.constraints,
          })),
          warnings: result.warnings,
        },
      );
    } else if (result.warnings.length > 0) {
      await this.auditLogService.logAction(
        'EXECUTE',
        AuditResourceType.SYSTEM,
        `validation-warnings-${className}`,
        true,
        `Validation passed with warnings for ${className}: ${result.warnings.length} warnings`,
        {},
        {
          warnings: result.warnings,
        },
      );
    }
  }

  private isClass(metatype: any): boolean {
    return metatype && typeof metatype === 'function' && metatype.prototype;
  }
}
