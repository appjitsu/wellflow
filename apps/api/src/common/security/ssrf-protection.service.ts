import { Injectable, Logger } from '@nestjs/common';
import { URL } from 'url';
import { promisify } from 'util';
import { lookup } from 'dns';
import { AuditLogService } from '../../application/services/audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../../domain/entities/audit-log.entity';

const dnsLookup = promisify(lookup);

/**
 * SSRF Protection Result
 */
export interface SSRFValidationResult {
  isAllowed: boolean;
  reason?: string;
  blockedBy?: 'protocol' | 'domain' | 'ip_range' | 'dns_resolution' | 'port';
  resolvedIp?: string;
  requestId: string;
}

/**
 * SSRF Protection Configuration
 */
export interface SSRFProtectionConfig {
  allowedDomains: string[];
  allowedProtocols: string[];
  blockedIpRanges: string[];
  allowedPorts: number[];
  enableDnsResolution: boolean;
  maxRedirects: number;
  timeoutMs: number;
}

/**
 * SSRF Protection Service
 *
 * Implements comprehensive Server-Side Request Forgery (SSRF) protection
 * following OWASP API Security Top 10 2023 - API7:2023 requirements.
 *
 * Designed specifically for critical oil & gas infrastructure to protect
 * against internal network attacks and unauthorized API consumption.
 *
 * Features:
 * - URL validation with allowlist/blocklist
 * - Internal network IP range blocking (RFC 1918, localhost, etc.)
 * - DNS resolution validation
 * - Protocol and port restrictions
 * - Comprehensive audit logging
 * - Integration with existing security infrastructure
 */
@Injectable()
export class SSRFProtectionService {
  private readonly logger = new Logger(SSRFProtectionService.name);
  private static readonly UNKNOWN_ERROR_MESSAGE = 'Unknown error';

  private readonly defaultConfig: SSRFProtectionConfig = {
    // Allowed domains for oil & gas regulatory and operational APIs
    allowedDomains: [
      'api.weather.gov', // NOAA Weather Service
      'api.rrc.texas.gov', // Texas Railroad Commission
      'api.epa.gov', // EPA regulatory reporting
      'secure.osha.gov', // OSHA safety reporting
      'api.eia.gov', // Energy Information Administration
      'api.bsee.gov', // Bureau of Safety and Environmental Enforcement
    ],

    // Only allow secure protocols
    allowedProtocols: ['https:', 'http:'], // http: only for development

    // Block internal network ranges (RFC 1918 + others)
    /* eslint-disable sonarjs/no-hardcoded-ip */
    blockedIpRanges: [
      '10.0.0.0/8', // RFC 1918 private networks
      '172.16.0.0/12', // RFC 1918 private networks
      '192.168.0.0/16', // RFC 1918 private networks
      '127.0.0.0/8', // Loopback
      '169.254.0.0/16', // Link-local
      '224.0.0.0/4', // Multicast
      '240.0.0.0/4', // Reserved
      '0.0.0.0/8', // Current network
      '100.64.0.0/10', // Carrier-grade NAT
      '198.18.0.0/15', // Benchmark testing
      '203.0.113.0/24', // Documentation
      '::1/128', // IPv6 loopback
      'fc00::/7', // IPv6 unique local
      'fe80::/10', // IPv6 link-local
    ],
    /* eslint-enable sonarjs/no-hardcoded-ip */

    // Standard HTTP/HTTPS ports only
    allowedPorts: [80, 443],

    enableDnsResolution: true,
    maxRedirects: 0, // No redirects allowed for security
    timeoutMs: 10000, // 10 second timeout
  };

  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Validate URL for SSRF protection
   *
   * @param url - The URL to validate
   * @param userId - Optional user ID for audit logging
   * @param config - Optional custom configuration
   * @returns Promise<SSRFValidationResult>
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async validateURL(
    url: string,
    userId?: string,
    config?: Partial<SSRFProtectionConfig>,
  ): Promise<SSRFValidationResult> {
    const requestId = this.generateRequestId();
    const effectiveConfig = { ...this.defaultConfig, ...config };

    try {
      this.logger.debug(`SSRF validation started for URL: ${url}`, {
        requestId,
        userId,
      });

      // Step 1: Basic URL parsing
      const parsedUrl = this.parseURL(url);
      if (!parsedUrl.isValid) {
        return this.createBlockedResult(
          requestId,
          'Invalid URL format',
          'protocol',
        );
      }

      // Step 2: Protocol validation
      if (!parsedUrl.url) {
        return this.createBlockedResult(
          this.generateRequestId(),
          'Invalid URL object',
          'protocol',
        );
      }

      const protocolCheck = this.validateProtocol(
        parsedUrl.url,
        effectiveConfig,
      );
      if (!protocolCheck.isAllowed) {
        await this.logSecurityEvent(
          'SSRF_BLOCKED_PROTOCOL',
          url,
          protocolCheck.reason || 'Protocol validation failed',
          userId,
          requestId,
        );
        return protocolCheck;
      }

      // Step 3: Domain validation
      const domainCheck = this.validateDomain(parsedUrl.url, effectiveConfig);
      if (!domainCheck.isAllowed) {
        await this.logSecurityEvent(
          'SSRF_BLOCKED_DOMAIN',
          url,
          domainCheck.reason || 'Domain validation failed',
          userId,
          requestId,
        );
        return domainCheck;
      }

      // Step 4: Port validation
      const portCheck = this.validatePort(parsedUrl.url, effectiveConfig);
      if (!portCheck.isAllowed) {
        await this.logSecurityEvent(
          'SSRF_BLOCKED_PORT',
          url,
          portCheck.reason || 'Port validation failed',
          userId,
          requestId,
        );
        return portCheck;
      }

      // Step 5: DNS resolution and IP validation
      if (effectiveConfig.enableDnsResolution) {
        const ipCheck = await this.validateIPAddress(
          parsedUrl.url,
          effectiveConfig,
          requestId,
        );
        if (!ipCheck.isAllowed) {
          await this.logSecurityEvent(
            'SSRF_BLOCKED_IP',
            url,
            ipCheck.reason || 'IP validation failed',
            userId,
            requestId,
          );
          return ipCheck;
        }
      }

      // All checks passed
      await this.logSecurityEvent(
        'SSRF_ALLOWED',
        url,
        'URL passed all SSRF protection checks',
        userId,
        requestId,
      );

      this.logger.log(`SSRF validation passed for URL: ${url}`, {
        requestId,
        userId,
      });

      return {
        isAllowed: true,
        requestId,
      };
    } catch (error) {
      this.logger.error(`SSRF validation error for URL: ${url}`, {
        error:
          error instanceof Error
            ? error.message
            : SSRFProtectionService.UNKNOWN_ERROR_MESSAGE,
        requestId,
        userId,
      });

      await this.logSecurityEvent(
        'SSRF_VALIDATION_ERROR',
        url,
        `Validation error: ${error instanceof Error ? error.message : SSRFProtectionService.UNKNOWN_ERROR_MESSAGE}`,
        userId,
        requestId,
      );

      return this.createBlockedResult(
        requestId,
        'SSRF validation error - request blocked for security',
        'dns_resolution',
      );
    }
  }

  /**
   * Parse and validate URL format
   */
  private parseURL(url: string): { isValid: boolean; url?: URL } {
    try {
      const parsedUrl = new URL(url);
      return { isValid: true, url: parsedUrl };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Validate protocol against allowlist
   */
  private validateProtocol(
    url: URL,
    config: SSRFProtectionConfig,
  ): SSRFValidationResult {
    const requestId = this.generateRequestId();

    if (!config.allowedProtocols.includes(url.protocol)) {
      return this.createBlockedResult(
        requestId,
        `Protocol '${url.protocol}' not allowed. Allowed protocols: ${config.allowedProtocols.join(', ')}`,
        'protocol',
      );
    }

    return { isAllowed: true, requestId };
  }

  /**
   * Validate domain against allowlist
   */
  private validateDomain(
    url: URL,
    config: SSRFProtectionConfig,
  ): SSRFValidationResult {
    const requestId = this.generateRequestId();
    const hostname = url.hostname.toLowerCase();

    // Check if domain is in allowlist
    const isAllowed = config.allowedDomains.some((allowedDomain) => {
      const normalizedDomain = allowedDomain.toLowerCase();
      return (
        hostname === normalizedDomain ||
        hostname.endsWith(`.${normalizedDomain}`)
      );
    });

    if (!isAllowed) {
      return this.createBlockedResult(
        requestId,
        `Domain '${hostname}' not in allowlist. Allowed domains: ${config.allowedDomains.join(', ')}`,
        'domain',
      );
    }

    return { isAllowed: true, requestId };
  }

  /**
   * Validate port against allowlist
   */
  private validatePort(
    url: URL,
    config: SSRFProtectionConfig,
  ): SSRFValidationResult {
    const requestId = this.generateRequestId();
    const port = url.port
      ? parseInt(url.port, 10)
      : this.getDefaultPort(url.protocol);

    if (!config.allowedPorts.includes(port)) {
      return this.createBlockedResult(
        requestId,
        `Port ${port} not allowed. Allowed ports: ${config.allowedPorts.join(', ')}`,
        'port',
      );
    }

    return { isAllowed: true, requestId };
  }

  /**
   * Validate IP address against blocked ranges
   */
  private async validateIPAddress(
    url: URL,
    config: SSRFProtectionConfig,
    requestId: string,
  ): Promise<SSRFValidationResult> {
    try {
      // Resolve hostname to IP address
      const { address: resolvedIp } = await dnsLookup(url.hostname);

      // Check if resolved IP is in blocked ranges
      for (const blockedRange of config.blockedIpRanges) {
        if (this.isIpInRange(resolvedIp, blockedRange)) {
          return {
            isAllowed: false,
            reason: `Resolved IP '${resolvedIp}' is in blocked range '${blockedRange}'`,
            blockedBy: 'ip_range',
            resolvedIp,
            requestId,
          };
        }
      }

      return {
        isAllowed: true,
        resolvedIp,
        requestId,
      };
    } catch (error) {
      return {
        isAllowed: false,
        reason: `DNS resolution failed: ${error instanceof Error ? error.message : SSRFProtectionService.UNKNOWN_ERROR_MESSAGE}`,
        blockedBy: 'dns_resolution',
        requestId,
      };
    }
  }

  /**
   * Check if IP address is within a CIDR range
   */
  private isIpInRange(ip: string, cidr: string): boolean {
    // Simple IPv4 CIDR check implementation
    // In production, consider using a library like 'ip-range-check'
    const [rangeIp, prefixLength] = cidr.split('/');

    if (!rangeIp || !prefixLength) {
      return false;
    }

    const prefixLen = parseInt(prefixLength, 10);

    if (prefixLen === 0) return true;

    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(rangeIp);
    const mask = (0xffffffff << (32 - prefixLen)) >>> 0;

    return (ipNum & mask) === (rangeNum & mask);
  }

  /**
   * Convert IP address to number for comparison
   */
  private ipToNumber(ip: string): number {
    return (
      ip
        .split('.')
        .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    );
  }

  /**
   * Get default port for protocol
   */
  private getDefaultPort(protocol: string): number {
    switch (protocol) {
      case 'http:':
        return 80;
      case 'https:':
        return 443;
      default:
        return 80;
    }
  }

  /**
   * Create blocked result
   */
  private createBlockedResult(
    requestId: string,
    reason: string,
    blockedBy: SSRFValidationResult['blockedBy'],
  ): SSRFValidationResult {
    return {
      isAllowed: false,
      reason,
      blockedBy,
      requestId,
    };
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    // eslint-disable-next-line sonarjs/pseudo-random
    return `ssrf_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Log security events for audit trail
   */
  private async logSecurityEvent(
    action: string,
    url: string,
    details: string,
    userId?: string,
    requestId?: string,
  ): Promise<void> {
    try {
      await this.auditLogService.logAction(
        action as AuditAction,
        AuditResourceType.EXTERNAL_SERVICE,
        requestId || 'unknown',
        action.includes('ALLOWED'), // success if action contains 'ALLOWED'
        action.includes('BLOCKED') ? details : undefined,
        {},
        {
          serviceName: 'SSRFProtectionService',
          technicalContext: {
            url,
            details,
            requestId,
            userId,
            timestamp: new Date().toISOString(),
          },
        },
      );
    } catch (error) {
      this.logger.error('Failed to log SSRF security event', {
        error:
          error instanceof Error
            ? error.message
            : SSRFProtectionService.UNKNOWN_ERROR_MESSAGE,
        action,
        url,
        requestId,
      });
    }
  }

  /**
   * Get current configuration (for testing/debugging)
   */
  getConfiguration(): SSRFProtectionConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update allowed domains (for dynamic configuration)
   */
  updateAllowedDomains(domains: string[]): void {
    this.defaultConfig.allowedDomains = [...domains];
    this.logger.log('Updated allowed domains for SSRF protection', {
      domains,
    });
  }
}
