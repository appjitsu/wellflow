import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppConfigService } from '../../config/app.config';

/**
 * Security Headers Middleware
 * Adds comprehensive security headers for oil & gas critical infrastructure
 *
 * Implements security headers per:
 * - OWASP Secure Headers Project
 * - NIST Cybersecurity Framework
 * - IEC 62443 Industrial Cybersecurity Standards
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private readonly configService: AppConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy - Prevent XSS and injection attacks
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' https:; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'",
    );

    // HTTP Strict Transport Security - Force HTTPS in production
    if (this.configService.isProduction) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // X-Frame-Options - Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // X-Content-Type-Options - Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Referrer Policy - Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // X-XSS-Protection - Enable XSS filtering (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Permissions Policy - Control browser features
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );

    // Cross-Origin Embedder Policy - Isolate the origin
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    // Cross-Origin Opener Policy - Isolate browsing context
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin Resource Policy - Control cross-origin requests
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // Remove server information disclosure
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Custom security headers for oil & gas industry compliance
    res.setHeader('X-Industry-Compliance', 'IEC-62443,NIST-CSF,API-1164');
    res.setHeader('X-Security-Policy', 'Critical-Infrastructure');

    next();
  }
}
