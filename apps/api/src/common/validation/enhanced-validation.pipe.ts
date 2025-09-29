import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';
import { AuditLogService } from '../../application/services/audit-log.service';
import {
  AuditResourceType,
  AuditAction,
} from '../../domain/entities/audit-log.entity';

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
  sanitizedData: unknown;
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
export class EnhancedValidationPipe implements PipeTransform<unknown> {
  private readonly logger = new Logger(EnhancedValidationPipe.name);

  constructor(@Optional() private readonly auditLogService?: AuditLogService) {}

  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const { metatype } = metadata;
    if (!metatype || !this.isClass(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, value) as unknown;

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
    object: unknown,
    metadata: ArgumentMetadata,
  ): Promise<ValidationResult> {
    const obj = object as Record<string, unknown>;
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // 1. Standard class-validator validation
    const classValidatorErrors = await validate(obj, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });
    errors.push(...classValidatorErrors);

    // 2. Domain-specific validation
    const domainValidation = await this.validateDomainRules(obj, metadata);
    errors.push(...domainValidation.errors);
    warnings.push(...domainValidation.warnings);

    // 3. Security validation
    const securityValidation = await this.validateSecurityRules(obj, metadata);
    errors.push(...securityValidation.errors);
    warnings.push(...securityValidation.warnings);

    // 4. Business rule validation
    const businessValidation = await this.validateBusinessRules(obj, metadata);
    errors.push(...businessValidation.errors);
    warnings.push(...businessValidation.warnings);

    // 5. Data sanitization
    const sanitizedData = await this.sanitizeData(obj, metadata);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData,
    };
  }

  private async validateDomainRules(
    object: unknown,
    metadata: ArgumentMetadata,
  ): Promise<ValidationResult> {
    const obj = object as Record<string, unknown>;
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    const className = metadata.metatype?.name;

    switch (className) {
      case 'CreateWellDto':
        await this.validateWellCreation(obj, errors, warnings);
        break;
      case 'UpdateWellDto':
        await this.validateWellUpdate(obj, errors, warnings);
        break;
      case 'CreateLeaseDto':
        await this.validateLeaseCreation(obj, errors, warnings);
        break;
      case 'CreateProductionDto':
        await this.validateProductionData(obj, errors, warnings);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: obj as unknown,
    };
  }

  private async validateSecurityRules(
    object: unknown,
    _metadata: ArgumentMetadata,
  ): Promise<ValidationResult> {
    const obj = object as Record<string, unknown>;
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check for SQL injection patterns
    const sqlInjectionPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(-{2}|\/\*|\*\/)/, // SQL comments
      /('|(\\x27)|(\\x2D))/, // Quotes and dashes
    ];

    const objectString = JSON.stringify(obj);
    sqlInjectionPatterns.forEach((pattern) => {
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

    xssPatterns.forEach((pattern) => {
      if (pattern.test(objectString)) {
        warnings.push('Potential XSS pattern detected');
      }
    });

    // Check for sensitive data exposure
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'ssn',
      'creditCard',
    ];
    /* eslint-disable security/detect-object-injection */
    Object.keys(obj).forEach((key) => {
      if (sensitiveFields.includes(key) && obj[key]) {
        errors.push({
          target: obj,
          property: key,
          value: obj[key],
          constraints: {
            sensitiveData:
              'Sensitive data should not be included in request body',
          },
        } as ValidationError);
      }
    });
    /* eslint-enable security/detect-object-injection */

    return Promise.resolve({
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: obj as unknown,
    });
  }

  private async validateBusinessRules(
    object: unknown,
    metadata: ArgumentMetadata,
  ): Promise<ValidationResult> {
    const obj = object as Record<string, unknown>;
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

    return Promise.resolve({
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: obj as unknown,
    });
  }

  private async sanitizeData(
    object: unknown,
    _metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const sanitized = { ...(object as Record<string, unknown>) };

    // Trim string fields
    /* eslint-disable security/detect-object-injection */
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });

    // Sanitize HTML content if present
    const htmlFields = ['description', 'notes', 'comments'];
    Object.keys(sanitized).forEach((key) => {
      if (
        htmlFields.includes(key) &&
        sanitized[key] &&
        typeof sanitized[key] === 'string'
      ) {
        // Use sanitize-html for robust HTML sanitization
        sanitized[key] = sanitizeHtml(String(sanitized[key]), {
          allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'], // Allow basic formatting
          allowedAttributes: {},
          allowedSchemes: ['http', 'https', 'mailto'],
        });
      }
    });
    /* eslint-enable security/detect-object-injection */

    // Normalize email addresses
    if (sanitized.email && typeof sanitized.email === 'string') {
      sanitized.email = sanitized.email.toLowerCase();
    }

    return Promise.resolve(sanitized as unknown);
  }

  private async validateWellCreation(
    object: Record<string, unknown>,
    errors: ValidationError[],
    warnings: string[],
  ): Promise<void> {
    // Validate API number format (14 digits)
    if (
      object.apiNumber &&
      typeof object.apiNumber === 'string' &&
      !/^\d{14}$/.test(object.apiNumber)
    ) {
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
    if (
      object.location &&
      typeof object.location === 'object' &&
      'coordinates' in object.location &&
      typeof object.location.coordinates === 'object' &&
      object.location.coordinates !== null
    ) {
      const coordinates = object.location.coordinates as {
        latitude?: number;
        longitude?: number;
      };
      const { latitude, longitude } = coordinates;
      if (typeof latitude === 'number' && (latitude < -90 || latitude > 90)) {
        errors.push({
          target: object,
          property: 'location.coordinates.latitude',
          value: latitude,
          constraints: {
            coordinateRange: 'Latitude must be between -90 and 90 degrees',
          },
        } as ValidationError);
      }
      if (
        typeof longitude === 'number' &&
        (longitude < -180 || longitude > 180)
      ) {
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
    const validWellTypes = [
      'OIL',
      'GAS',
      'WATER',
      'INJECTION',
      'OBSERVATION',
      'DRY_HOLE',
    ];
    if (
      object.wellType &&
      typeof object.wellType === 'string' &&
      !validWellTypes.includes(object.wellType)
    ) {
      warnings.push(
        `Well type '${object.wellType}' is not in the standard list`,
      );
    }
    return Promise.resolve();
  }

  private async validateWellUpdate(
    _object: Record<string, unknown>,
    _errors: ValidationError[],
    _warnings: string[],
  ): Promise<void> {
    // Similar validations but for updates
    // Could add additional rules for what can be updated
  }

  private async validateLeaseCreation(
    object: Record<string, unknown>,
    errors: ValidationError[],
    _warnings: string[],
  ): Promise<void> {
    // Validate lease dates
    if (
      object.effectiveDate &&
      object.expirationDate &&
      (typeof object.effectiveDate === 'string' ||
        typeof object.effectiveDate === 'number' ||
        object.effectiveDate instanceof Date) &&
      (typeof object.expirationDate === 'string' ||
        typeof object.expirationDate === 'number' ||
        object.expirationDate instanceof Date)
    ) {
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
    if (
      object.royaltyRate !== undefined &&
      object.royaltyRate !== null &&
      typeof object.royaltyRate === 'number'
    ) {
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
    return Promise.resolve();
  }

  private async validateProductionData(
    object: Record<string, unknown>,
    errors: ValidationError[],
    warnings: string[],
  ): Promise<void> {
    // Validate production date is not in the future
    if (
      object.productionDate &&
      (typeof object.productionDate === 'string' ||
        typeof object.productionDate === 'number' ||
        object.productionDate instanceof Date)
    ) {
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
    /* eslint-disable security/detect-object-injection */
    Object.keys(object).forEach((key) => {
      if (
        volumeFields.includes(key) &&
        object[key] !== undefined &&
        object[key] !== null &&
        typeof object[key] === 'number'
      ) {
        const value = object[key];
        if (value < 0) {
          errors.push({
            target: object,
            property: key,
            value: value,
            constraints: {
              positiveVolume: `${key} cannot be negative`,
            },
          } as ValidationError);
        }

        // Warn for unusually high volumes
        if (value > 10000) {
          warnings.push(`${key} seems unusually high: ${value}`);
        }
      }
    });
    /* eslint-enable security/detect-object-injection */
    return Promise.resolve();
  }

  private formatValidationErrors(
    errors: ValidationError[],
  ): Array<Record<string, unknown>> {
    return errors.map((error) => ({
      field: error.property,
      value: error.value as unknown,
      constraints: error.constraints,
      children: error.children?.map(
        (child) => this.formatValidationErrors([child])[0],
      ),
    }));
  }

  private async logValidationResult(
    result: ValidationResult,
    metadata: ArgumentMetadata,
  ): Promise<void> {
    if (!this.auditLogService) return;

    const className = metadata.metatype?.name || 'Unknown';

    if (!result.isValid) {
      await this.auditLogService.logAction(
        AuditAction.EXECUTE,
        AuditResourceType.SYSTEM,
        `validation-failed-${className}`,
        false,
        `Validation failed for ${className}: ${result.errors.length} errors`,
        {},
        {
          validationErrors: result.errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
          warnings: result.warnings,
        },
      );
    } else if (result.warnings.length > 0) {
      await this.auditLogService.logAction(
        AuditAction.EXECUTE,
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

  private isClass(metatype: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return metatype && typeof metatype === 'function' && metatype.prototype;
  }
}
