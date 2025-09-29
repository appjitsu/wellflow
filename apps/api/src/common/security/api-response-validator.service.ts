import { Injectable, Logger } from '@nestjs/common';
import { AuditLogService } from '../../application/services/audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../../domain/entities/audit-log.entity';
import { ErrorFactory } from '../errors/domain-errors';

/**
 * API Response Validation Result
 */
export interface ApiResponseValidationResult {
  isValid: boolean;
  sanitizedResponse?: unknown;
  violations?: SecurityViolation[];
  requestId: string;
}

/**
 * Security Violation Details
 */
export interface SecurityViolation {
  type:
    | 'response_size'
    | 'content_type'
    | 'malicious_content'
    | 'xss'
    | 'injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  field?: string;
  value?: string;
}

/**
 * Response Validation Configuration
 */
export interface ResponseValidationConfig {
  maxResponseSizeBytes: number;
  allowedContentTypes: string[];
  enableXssDetection: boolean;
  enableInjectionDetection: boolean;
  enableMaliciousContentDetection: boolean;
  sanitizeResponse: boolean;
}

/**
 * API Response Validator Service
 *
 * Implements OWASP API Security Top 10 2023 - API10:2023 requirements
 * for secure consumption of external APIs with comprehensive response validation.
 *
 * Features:
 * - Response size limits to prevent DoS attacks
 * - Content type validation
 * - XSS prevention from external API responses
 * - SQL injection detection in response data
 * - Malicious payload detection
 * - Response sanitization
 * - Comprehensive audit logging
 */
@Injectable()
export class ApiResponseValidatorService {
  private readonly logger = new Logger(ApiResponseValidatorService.name);

  private readonly defaultConfig: ResponseValidationConfig = {
    maxResponseSizeBytes: 10 * 1024 * 1024, // 10MB limit
    allowedContentTypes: [
      'application/json',
      'application/xml',
      'text/xml',
      'text/plain',
      'application/x-www-form-urlencoded',
    ],
    enableXssDetection: true,
    enableInjectionDetection: true,
    enableMaliciousContentDetection: true,
    sanitizeResponse: true,
  };

  // XSS detection patterns
  private readonly xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src\s*=\s*["']?javascript:/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*href\s*=\s*["']?javascript:/gi,
  ];

  // SQL injection detection patterns
  private readonly injectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /('|(\\')|(;)|(--)|(\s)|(\/\*)|(\*\/))/gi,
    /(\b(WAITFOR|DELAY)\b)/gi,
    /(\b(CAST|CONVERT|SUBSTRING|ASCII|CHAR)\b)/gi,
  ];

  // Malicious content patterns
  private readonly maliciousPatterns = [
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /document\.cookie/gi,
    /window\.location/gi,
    /document\.write/gi,
    /innerHTML/gi,
    /outerHTML/gi,
  ];

  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Validate and sanitize external API response
   *
   * @param response - The response data from external API
   * @param contentType - The content type of the response
   * @param serviceName - Name of the external service
   * @param operation - The operation being performed
   * @param config - Optional custom configuration
   * @returns Promise<ApiResponseValidationResult>
   */
  async validateResponse(
    response: unknown,
    contentType: string | undefined,
    serviceName: string,
    operation: string,
    config?: Partial<ResponseValidationConfig>,
  ): Promise<ApiResponseValidationResult> {
    const requestId = this.generateRequestId();
    const effectiveConfig = { ...this.defaultConfig, ...config };

    try {
      this.logger.debug(`Validating API response from ${serviceName}`, {
        requestId,
        operation,
        contentType,
      });

      const violations = this.performValidationChecks(
        response,
        contentType,
        effectiveConfig,
      );

      return await this.processValidationResults(
        response,
        violations,
        serviceName,
        operation,
        requestId,
        effectiveConfig,
      );
    } catch (error) {
      this.logger.error(`API response validation error`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        serviceName,
        operation,
      });

      throw ErrorFactory.externalApi(
        `Response validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        serviceName,
        operation,
        { requestId },
      );
    }
  }

  private performValidationChecks(
    response: unknown,
    contentType: string | undefined,
    effectiveConfig: ResponseValidationConfig,
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    // Step 1: Response size validation
    const sizeViolation = this.validateResponseSize(response, effectiveConfig);
    if (sizeViolation) {
      violations.push(sizeViolation);
    }

    // Step 2: Content type validation
    const contentTypeViolation = this.validateContentType(
      contentType,
      effectiveConfig,
    );
    if (contentTypeViolation) {
      violations.push(contentTypeViolation);
    }

    // Step 3: Security content validation
    const securityViolations = this.performSecurityChecks(
      response,
      effectiveConfig,
    );
    violations.push(...securityViolations);

    return violations;
  }

  private performSecurityChecks(
    response: unknown,
    effectiveConfig: ResponseValidationConfig,
  ): SecurityViolation[] {
    const violations: SecurityViolation[] = [];
    const responseString = JSON.stringify(response);

    if (effectiveConfig.enableXssDetection) {
      const xssViolations = this.detectXssContent(responseString);
      violations.push(...xssViolations);
    }

    if (effectiveConfig.enableInjectionDetection) {
      const injectionViolations = this.detectInjectionContent(responseString);
      violations.push(...injectionViolations);
    }

    if (effectiveConfig.enableMaliciousContentDetection) {
      const maliciousViolations = this.detectMaliciousContent(responseString);
      violations.push(...maliciousViolations);
    }

    return violations;
  }

  private async processValidationResults(
    response: unknown,
    violations: SecurityViolation[],
    serviceName: string,
    operation: string,
    requestId: string,
    effectiveConfig: ResponseValidationConfig,
  ): Promise<ApiResponseValidationResult> {
    // Check for critical violations
    const criticalViolations = violations.filter(
      (v) => v.severity === 'critical',
    );
    if (criticalViolations.length > 0) {
      await this.logSecurityViolation(
        'API_RESPONSE_BLOCKED',
        serviceName,
        operation,
        criticalViolations,
        requestId,
      );

      return {
        isValid: false,
        violations: criticalViolations,
        requestId,
      };
    }

    // Sanitize response if enabled
    let sanitizedResponse = response;
    if (effectiveConfig.sanitizeResponse && violations.length > 0) {
      sanitizedResponse = this.sanitizeResponse(response);
    }

    // Log non-critical violations for monitoring
    if (violations.length > 0) {
      await this.logSecurityViolation(
        'API_RESPONSE_VIOLATIONS_DETECTED',
        serviceName,
        operation,
        violations,
        requestId,
      );
    }

    this.logger.debug(`API response validation completed`, {
      requestId,
      serviceName,
      operation,
      violationsCount: violations.length,
      isValid: true,
    });

    return {
      isValid: true,
      sanitizedResponse,
      violations: violations.length > 0 ? violations : undefined,
      requestId,
    };
  }

  /**
   * Validate response size
   */
  private validateResponseSize(
    response: unknown,
    config: ResponseValidationConfig,
  ): SecurityViolation | null {
    const responseSize = JSON.stringify(response).length;

    if (responseSize > config.maxResponseSizeBytes) {
      return {
        type: 'response_size',
        severity: 'critical',
        description: `Response size ${responseSize} bytes exceeds maximum allowed ${config.maxResponseSizeBytes} bytes`,
      };
    }

    return null;
  }

  /**
   * Validate content type
   */
  private validateContentType(
    contentType: string | undefined,
    config: ResponseValidationConfig,
  ): SecurityViolation | null {
    if (!contentType) {
      return {
        type: 'content_type',
        severity: 'medium',
        description: 'Missing content type header',
      };
    }

    return this.validateNonEmptyContentType(contentType, config);
  }

  private validateNonEmptyContentType(
    contentType: string,
    config: ResponseValidationConfig,
  ): SecurityViolation | null {
    // @ts-expect-error - TypeScript compiler issue with strict null checks
    const normalizedContentType = contentType
      .toLowerCase()
      .split(';')[0]
      .trim();

    if (!config.allowedContentTypes.includes(normalizedContentType)) {
      return {
        type: 'content_type',
        severity: 'high',
        description: `Content type '${contentType}' is not in allowed list: ${config.allowedContentTypes.join(', ')}`,
      };
    }

    return null;
  }

  /**
   * Detect XSS content in response
   */
  private detectXssContent(responseString: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const pattern of this.xssPatterns) {
      const matches = pattern.exec(responseString);
      if (matches) {
        violations.push({
          type: 'xss',
          severity: 'high',
          description: `Potential XSS content detected: ${matches[0].substring(0, 100)}...`,
          value: matches[0],
        });
      }
    }

    return violations;
  }

  /**
   * Detect injection content in response
   */
  private detectInjectionContent(responseString: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const pattern of this.injectionPatterns) {
      const matches = pattern.exec(responseString);
      if (matches) {
        violations.push({
          type: 'injection',
          severity: 'high',
          description: `Potential SQL injection content detected: ${matches[0]}`,
          value: matches[0],
        });
      }
    }

    return violations;
  }

  /**
   * Detect malicious content in response
   */
  private detectMaliciousContent(responseString: string): SecurityViolation[] {
    const violations: SecurityViolation[] = [];

    for (const pattern of this.maliciousPatterns) {
      const matches = pattern.exec(responseString);
      if (matches) {
        violations.push({
          type: 'malicious_content',
          severity: 'medium',
          description: `Potentially malicious content detected: ${matches[0]}`,
          value: matches[0],
        });
      }
    }

    return violations;
  }

  /**
   * Sanitize response data
   */
  private sanitizeResponse(response: unknown): unknown {
    if (typeof response === 'string') {
      return this.sanitizeString(response);
    }

    if (Array.isArray(response)) {
      return response.map((item) => this.sanitizeResponse(item));
    }

    if (response && typeof response === 'object') {
      const sanitized: Record<string, unknown> = {};
      const responseObj = response as Record<string, unknown>;
      for (const [key, value] of Object.entries(responseObj)) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[key] = this.sanitizeResponse(value);
      }
      return sanitized;
    }

    return response;
  }

  /**
   * Sanitize string content
   */
  private sanitizeString(input: string): string {
    let sanitized = input;

    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');

    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    return sanitized;
  }

  /**
   * Log security violation
   */
  private async logSecurityViolation(
    action: string,
    serviceName: string,
    operation: string,
    violations: SecurityViolation[],
    requestId: string,
  ): Promise<void> {
    try {
      await this.auditLogService.logAction(
        action as AuditAction,
        AuditResourceType.EXTERNAL_SERVICE,
        `${serviceName}-${operation}`,
        false, // security violation = failure
        `Security violations detected: ${violations.map((v) => v.description).join(', ')}`,
        {},
        {
          serviceName,
          violations: violations.map((v) => ({
            type: v.type,
            severity: v.severity,
            description: v.description,
          })),
          technicalContext: {
            operation,
            requestId,
          },
        },
      );
    } catch (error) {
      this.logger.error('Failed to log security violation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
      });
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    // eslint-disable-next-line sonarjs/pseudo-random
    return `resp-val-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
