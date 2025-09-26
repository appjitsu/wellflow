import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { AuditLogService } from '../../application/services/audit-log.service';
import { AuditResourceType } from '../../domain/entities/audit-log.entity';

interface SecurityViolation {
  type:
    | 'sql_injection'
    | 'xss'
    | 'command_injection'
    | 'path_traversal'
    | 'malformed_data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  field?: string;
  value?: any;
  pattern: string;
  description: string;
}

/**
 * Security Validation Pipe
 * Specialized pipe for detecting and preventing security threats
 */
@Injectable()
export class SecurityValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(SecurityValidationPipe.name);

  // Security patterns to detect
  private readonly sqlInjectionPatterns = [
    {
      pattern:
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bEXEC\b|\bEXECUTE\b)/i,
      severity: 'high' as const,
    },
    { pattern: /(-{2}|\/\*|\*\/|;)/, severity: 'high' as const }, // SQL comments and statements
    { pattern: /(\bOR\b|\bAND\b).*(\=|\<|\>)/i, severity: 'medium' as const }, // Logic operators
    { pattern: /('|(\\x27)|(\\x2D))/, severity: 'medium' as const }, // Quotes
  ];

  private readonly xssPatterns = [
    {
      pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      severity: 'critical' as const,
    },
    { pattern: /javascript:/gi, severity: 'high' as const },
    { pattern: /on\w+\s*=/gi, severity: 'high' as const },
    {
      pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      severity: 'high' as const,
    },
    {
      pattern: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      severity: 'high' as const,
    },
    {
      pattern: /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      severity: 'high' as const,
    },
    { pattern: /vbscript:/gi, severity: 'high' as const },
    { pattern: /data:text\/html/gi, severity: 'medium' as const },
  ];

  private readonly commandInjectionPatterns = [
    { pattern: /(\||&|;|\$\(|\`)/, severity: 'critical' as const }, // Shell operators
    {
      pattern: /\b(rm|del|format|shutdown|reboot|halt)\b/i,
      severity: 'critical' as const,
    }, // Dangerous commands
    { pattern: /\b(cat|ls|pwd|whoami|id)\b/i, severity: 'high' as const }, // Information gathering
  ];

  private readonly pathTraversalPatterns = [
    { pattern: /\.\.[\/\\]/, severity: 'critical' as const }, // Directory traversal
    { pattern: /[\/\\]\.\./, severity: 'critical' as const },
    { pattern: /\.\.%2f/i, severity: 'critical' as const }, // URL encoded
    { pattern: /%2e%2e%2f/i, severity: 'critical' as const },
  ];

  private readonly malformedDataPatterns = [
    { pattern: /.{10000,}/, severity: 'medium' as const }, // Extremely long strings
    { pattern: /\u0000/, severity: 'high' as const }, // Null bytes
    {
      pattern: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/,
      severity: 'medium' as const,
    }, // Control characters
  ];

  constructor(@Optional() private readonly auditLogService?: AuditLogService) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const violations = await this.detectSecurityViolations(value, metadata);

    if (violations.length > 0) {
      await this.handleSecurityViolations(violations, value, metadata);

      const criticalViolations = violations.filter(
        (v) => v.severity === 'critical',
      );
      if (criticalViolations.length > 0) {
        throw new BadRequestException({
          message: 'Security violation detected',
          code: 'SECURITY_VIOLATION',
          violations: criticalViolations.map((v) => ({
            type: v.type,
            severity: v.severity,
            field: v.field,
            description: v.description,
          })),
        });
      }
    }

    // Sanitize the data
    return this.sanitizeData(value);
  }

  private async detectSecurityViolations(
    value: any,
    metadata: ArgumentMetadata,
  ): Promise<SecurityViolation[]> {
    const violations: SecurityViolation[] = [];
    const dataString = JSON.stringify(value);

    // Check all patterns
    const allPatterns = [
      ...this.sqlInjectionPatterns.map((p) => ({
        ...p,
        type: 'sql_injection' as const,
      })),
      ...this.xssPatterns.map((p) => ({ ...p, type: 'xss' as const })),
      ...this.commandInjectionPatterns.map((p) => ({
        ...p,
        type: 'command_injection' as const,
      })),
      ...this.pathTraversalPatterns.map((p) => ({
        ...p,
        type: 'path_traversal' as const,
      })),
      ...this.malformedDataPatterns.map((p) => ({
        ...p,
        type: 'malformed_data' as const,
      })),
    ];

    // Check overall data
    allPatterns.forEach(({ pattern, severity, type }) => {
      if (pattern.test(dataString)) {
        violations.push({
          type,
          severity,
          pattern: pattern.source,
          description: `Detected ${type} pattern in request data`,
        });
      }
    });

    // Check individual fields
    this.traverseObject(value, (fieldPath, fieldValue) => {
      if (typeof fieldValue === 'string') {
        allPatterns.forEach(({ pattern, severity, type }) => {
          if (pattern.test(fieldValue)) {
            violations.push({
              type,
              severity,
              field: fieldPath,
              value: fieldValue.substring(0, 100), // Truncate for logging
              pattern: pattern.source,
              description: `Detected ${type} pattern in field ${fieldPath}`,
            });
          }
        });
      }
    });

    return violations;
  }

  private traverseObject(
    obj: any,
    callback: (path: string, value: any) => void,
    path = '',
  ): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      callback(currentPath, value);

      if (typeof value === 'object' && value !== null) {
        this.traverseObject(value, callback, currentPath);
      }
    }
  }

  private async handleSecurityViolations(
    violations: SecurityViolation[],
    originalData: any,
    metadata: ArgumentMetadata,
  ): Promise<void> {
    const className = metadata.metatype?.name || 'Unknown';

    // Log security violations
    if (this.auditLogService) {
      const highSeverityViolations = violations.filter((v) =>
        ['high', 'critical'].includes(v.severity),
      );

      if (highSeverityViolations.length > 0) {
        await this.auditLogService.logAction(
          'EXECUTE',
          AuditResourceType.SYSTEM,
          `security-violation-${className}`,
          false,
          `Security violations detected: ${highSeverityViolations.length} high/critical violations`,
          {},
          {
            violations: highSeverityViolations.map((v) => ({
              type: v.type,
              severity: v.severity,
              field: v.field,
              pattern: v.pattern,
              description: v.description,
            })),
            className,
            dataSize: JSON.stringify(originalData).length,
          },
        );
      }
    }

    // Log to application logger
    violations.forEach((violation) => {
      const logLevel =
        violation.severity === 'critical'
          ? 'error'
          : violation.severity === 'high'
            ? 'warn'
            : 'debug';

      this.logger[logLevel](
        `Security violation detected: ${violation.description}`,
        {
          type: violation.type,
          severity: violation.severity,
          field: violation.field,
          className,
        },
      );
    });
  }

  private sanitizeData(data: any): any {
    const sanitized = { ...data };

    // Recursively sanitize all string values
    this.traverseObject(sanitized, (path, value) => {
      if (typeof value === 'string') {
        sanitized[path.split('.').pop()!] = this.sanitizeString(value);
      }
    });

    return sanitized;
  }

  private sanitizeString(str: string): string {
    return (
      str
        // Remove script tags
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove iframe tags
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove javascript: protocols
        .replace(/javascript:/gi, '')
        // Remove vbscript: protocols
        .replace(/vbscript:/gi, '')
        // Remove data: URLs that might contain scripts
        .replace(/data:text\/html/gi, '')
        // Remove null bytes
        .replace(/\u0000/g, '')
        // Remove control characters (except tabs and newlines)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Trim excessive whitespace
        .replace(/\s{3,}/g, ' ')
        .trim()
    );
  }
}
