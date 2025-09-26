import { Logger } from '@nestjs/common';
import {
  IAntiCorruptionLayer,
  TransformationContext,
  TransformationResult,
  ValidationSchema,
  ValidationResult,
  ACLStatistics,
} from './acl.interface';

/**
 * Base Regulatory ACL
 * Provides common functionality for all regulatory agency ACLs
 */
export abstract class BaseRegulatoryACL implements IAntiCorruptionLayer {
  protected readonly logger = new Logger(`${this.constructor.name}`);

  // Statistics tracking
  protected totalTransformations = 0;
  protected successfulTransformations = 0;
  protected failedTransformations = 0;
  protected transformationTimes: number[] = [];
  protected lastTransformationTime = new Date();

  abstract getIdentifier(): string;
  abstract canHandle(externalSystem: string, version?: string): boolean;
  abstract transformToDomain<TDomain>(
    externalData: unknown,
    context: TransformationContext,
  ): Promise<TransformationResult<TDomain>>;
  abstract transformToExternal(
    domainData: unknown,
    context: TransformationContext,
  ): Promise<TransformationResult<unknown>>;

  /**
   * Validate external data against schema
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  validateExternalData(
    externalData: unknown,
    schema: ValidationSchema,
  ): Promise<ValidationResult> {
    const errors: ValidationResult['errors'] = [];
    const warnings: ValidationResult['warnings'] = [];

    if (!externalData || typeof externalData !== 'object') {
      errors.push({
        field: 'root',
        message: 'External data must be a valid object',
        severity: 'error',
      });
      return Promise.resolve({ isValid: false, errors, warnings });
    }

    const data = externalData as Record<string, unknown>;

    // Check required fields
    /* eslint-disable security/detect-object-injection */
    for (const field of schema.requiredFields) {
      if (
        !(field in data) ||
        data[field] === null ||
        data[field] === undefined
      ) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'error',
        });
      }
    }
    /* eslint-enable security/detect-object-injection */

    // Check field types
    /* eslint-disable security/detect-object-injection */
    for (const [field, expectedType] of Object.entries(
      schema.fieldTypes || {},
    )) {
      if (field in data && data[field] !== null && data[field] !== undefined) {
        const actualValue = data[field];
        const actualType = typeof actualValue;

        if (expectedType === 'array' && !Array.isArray(actualValue)) {
          errors.push({
            field,
            message: `Field '${field}' must be an array, got ${actualType}`,
            severity: 'error',
          });
        } else if (expectedType !== 'array' && actualType !== expectedType) {
          errors.push({
            field,
            message: `Field '${field}' must be of type ${expectedType}, got ${actualType}`,
            severity: 'error',
            code: 'INVALID_FIELD_TYPE',
          });
        }
      }
    }
    /* eslint-enable security/detect-object-injection */

    // Check custom validations
    if (schema.customValidators) {
      for (const validation of schema.customValidators) {
        try {
          const result = validation.validator(data);
          if (!result.isValid) {
            errors.push({
              field: validation.field,
              message: result.message || 'Validation failed',
              severity: validation.severity || 'error',
              code: validation.code || 'CUSTOM_VALIDATION_FAILED',
            });
          }
        } catch (error) {
          errors.push({
            field: validation.field,
            message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
            code: 'VALIDATION_ERROR',
          });
        }
      }
    }

    return Promise.resolve({
      isValid: errors.length === 0,
      errors,
      warnings,
    });
  }

  /**
   * Get supported versions for this ACL
   */
  abstract getSupportedVersions(): string[];

  /**
   * Get statistics for this ACL
   */
  getStatistics(): ACLStatistics {
    const avgTime =
      this.transformationTimes.length > 0
        ? this.transformationTimes.reduce((a, b) => a + b, 0) /
          this.transformationTimes.length
        : 0;

    return {
      totalTransformations: this.totalTransformations,
      successfulTransformations: this.successfulTransformations,
      failedTransformations: this.failedTransformations,
      averageTransformationTime: avgTime,
      lastTransformationTime: this.lastTransformationTime,
      supportedSystems: this.getSupportedVersions().map(
        (v) => `${this.getIdentifier()}:${v}`,
      ),
      errorRate:
        this.totalTransformations > 0
          ? (this.failedTransformations / this.totalTransformations) * 100
          : 0,
      uptimePercentage:
        this.totalTransformations > 0
          ? (this.successfulTransformations / this.totalTransformations) * 100
          : 100,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.totalTransformations = 0;
    this.successfulTransformations = 0;
    this.failedTransformations = 0;
    this.transformationTimes = [];
    this.lastTransformationTime = new Date();
  }

  /**
   * Track transformation metrics
   */
  protected trackTransformation(success: boolean, executionTime: number): void {
    this.totalTransformations++;
    this.lastTransformationTime = new Date();

    if (success) {
      this.successfulTransformations++;
    } else {
      this.failedTransformations++;
    }

    // Keep only last 100 transformation times for memory efficiency
    this.transformationTimes.push(executionTime);
    if (this.transformationTimes.length > 100) {
      this.transformationTimes.shift();
    }
  }

  /**
   * Create standardized transformation result
   */
  protected createTransformationResult<TData>(
    success: boolean,
    data?: TData,
    errors?: string[],
    warnings?: string[],
    metadata?: Record<string, unknown>,
  ): TransformationResult<TData> {
    return {
      success,
      data,
      errors: errors || [],
      warnings: warnings || [],
      metadata: {
        ...metadata,
        transformationTime:
          typeof metadata?.transformationTime === 'number'
            ? metadata.transformationTime
            : 0,
        fieldsMapped:
          typeof metadata?.fieldsMapped === 'number'
            ? metadata.fieldsMapped
            : 0,
        fieldsSkipped:
          typeof metadata?.fieldsSkipped === 'number'
            ? metadata.fieldsSkipped
            : 0,
        externalVersion:
          typeof metadata?.externalVersion === 'string'
            ? metadata.externalVersion
            : this.getSupportedVersions()[0] || '1.0',
        internalVersion: '1.0',
      },
    };
  }
}
