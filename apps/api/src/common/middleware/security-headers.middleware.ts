import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppConfigService } from '../../config/app.config';

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  hstsMaxAge?: number;
  enableHSTS?: boolean;
  enableCSP?: boolean;
  enableCOEP?: boolean;
  enableCOOP?: boolean;
  enableCORP?: boolean;
  customHeaders?: Record<string, string>;
}

/**
 * Enhanced Security Headers Middleware
 * Adds comprehensive security headers for oil & gas critical infrastructure
 *
 * Implements security headers per:
 * - OWASP Secure Headers Project
 * - NIST Cybersecurity Framework
 * - IEC 62443 Industrial Cybersecurity Standards
 * - CISA Cybersecurity Performance Goals
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);

  constructor(private readonly configService: AppConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    try {
      this.setSecurityHeaders(req, res);
      this.setRequestTrackingHeaders(req, res);
      this.setComplianceHeaders(res);

      // Log potential security issues
      this.logSecurityEvents(req);

      next();
    } catch (error) {
      this.logger.error('Error in security headers middleware:', error);
      next();
    }
  }

  private setSecurityHeaders(req: Request, res: Response): void {
    const isProduction = this.configService.isProduction;

    // Content Security Policy - Enhanced XSS protection
    if (this.shouldEnableCSP(req)) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "img-src 'self' data: https: blob:; " +
          "font-src 'self' https://fonts.gstatic.com data:; " +
          "connect-src 'self' https://api.logrocket.com https://cdn.logrocket.com; " +
          "frame-ancestors 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'; " +
          'upgrade-insecure-requests; ' +
          'block-all-mixed-content',
      );

      // Content Security Policy Report-Only for monitoring
      res.setHeader(
        'Content-Security-Policy-Report-Only',
        "default-src 'self'; " + 'report-uri /api/security/csp-report',
      );
    }

    // HTTP Strict Transport Security - Enhanced HSTS
    if (isProduction) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload', // 2 years
      );
    }

    // X-Frame-Options - Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options - Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Referrer Policy - Enhanced referrer control
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // X-XSS-Protection - XSS filtering (legacy)
    res.setHeader(
      'X-XSS-Protection',
      '1; mode=block; report=/api/security/xss-report',
    );

    // Permissions Policy - Granular feature control
    res.setHeader(
      'Permissions-Policy',
      'camera=(), ' +
        'microphone=(), ' +
        'geolocation=(), ' +
        'payment=(), ' +
        'usb=(), ' +
        'magnetometer=(), ' +
        'accelerometer=(), ' +
        'gyroscope=(), ' +
        'ambient-light-sensor=(), ' +
        'autoplay=(), ' +
        'encrypted-media=(), ' +
        'fullscreen=(self), ' +
        'picture-in-picture=()',
    );

    // Cross-Origin Embedder Policy - CORP isolation
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin Opener Policy - Browsing context isolation
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin Resource Policy - Resource sharing control
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Origin-Agent-Cluster - Additional isolation
    res.setHeader('Origin-Agent-Cluster', '?1');

    // Remove server information disclosure
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
    res.removeHeader('X-AspNet-Version');
    res.removeHeader('X-AspNetMvc-Version');

    // Security.txt location
    res.setHeader('X-Security-TXT', '/.well-known/security.txt');

    // NEL (Network Error Logging) for monitoring
    if (isProduction) {
      res.setHeader(
        'NEL',
        JSON.stringify({
          report_to: 'network-errors',
          max_age: 86400,
          include_subdomains: true,
        }),
      );

      res.setHeader(
        'Report-To',
        JSON.stringify({
          group: 'network-errors',
          max_age: 86400,
          endpoints: [{ url: '/api/security/network-error' }],
        }),
      );
    }
  }

  private setRequestTrackingHeaders(req: Request, res: Response): void {
    // Request ID for tracing
    const requestId = this.generateRequestId();
    res.setHeader('X-Request-ID', requestId);

    // Store request ID on request object for use in audit logging
    (req as any).requestId = requestId;

    // Request timestamp
    res.setHeader('X-Request-Timestamp', new Date().toISOString());

    // API version information (will be overridden by version interceptor)
    res.setHeader('API-Version', 'v1');
  }

  private setComplianceHeaders(res: Response): void {
    // Industry compliance indicators
    res.setHeader(
      'X-Industry-Compliance',
      'IEC-62443,NIST-CSF,API-1164,CISA-CPG',
    );
    res.setHeader('X-Security-Policy', 'Critical-Infrastructure');
    res.setHeader('X-Data-Classification', 'Confidential');
    res.setHeader('X-Encryption', 'TLS-1.3');

    // Security contact information
    res.setHeader('X-Security-Contact', 'security@wellflow.com');
    res.setHeader('Contact', 'security@wellflow.com');
  }

  private shouldEnableCSP(req: Request): boolean {
    // Skip CSP for API routes that need to load external resources
    const apiRoutes = ['/api/docs', '/api/health', '/api/metrics'];
    return !apiRoutes.some((route) => req.path.startsWith(route));
  }

  private logSecurityEvents(req: Request): void {
    // Log suspicious patterns
    if (this.isSuspiciousRequest(req)) {
      this.logger.warn('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        headers: this.getSecurityRelevantHeaders(req),
      });
    }
  }

  private isSuspiciousRequest(req: Request): boolean {
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [
      /\b(sqlmap|nmap|nikto|dirbuster|owasp|acunetix)\b/i,
      /\b(union.*select|script.*alert|javascript:)\b/i,
      /\.\.\//, // Directory traversal (forward slashes)
    ];

    return suspiciousPatterns.some(
      (pattern) => pattern.test(userAgent) || pattern.test(req.url),
    );
  }

  private getSecurityRelevantHeaders(req: Request): Record<string, string> {
    const relevantHeaders = [
      'user-agent',
      'accept',
      'accept-encoding',
      'accept-language',
      'cache-control',
      'connection',
      'host',
      'x-forwarded-for',
      'x-forwarded-proto',
      'x-real-ip',
      'x-request-id',
    ];

    const result: Record<string, string> = {};
    relevantHeaders.forEach((header) => {
      const value = req.get(header);
      if (value) {
        result[header] = value;
      }
    });

    return result;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
