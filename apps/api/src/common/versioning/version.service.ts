import { Injectable, Logger } from '@nestjs/common';

export interface ApiVersion {
  version: string;
  releaseDate: Date;
  isDefault: boolean;
  isDeprecated: boolean;
  sunsetDate?: Date;
  changelog: string[];
  breakingChanges?: string[];
}

export interface VersionCompatibility {
  requestedVersion: string;
  resolvedVersion: string;
  isCompatible: boolean;
  warnings: string[];
  suggestedVersion?: string;
}

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name);

  private readonly versions: Map<string, ApiVersion> = new Map([
    ['v1', {
      version: 'v1',
      releaseDate: new Date('2024-01-01'),
      isDefault: true,
      isDeprecated: false,
      changelog: [
        'Initial API release',
        'Basic CRUD operations for wells, leases, and production',
        'JWT authentication',
        'Basic validation',
      ],
    }],
    ['v2', {
      version: 'v2',
      releaseDate: new Date('2024-06-01'),
      isDefault: false,
      isDeprecated: false,
      changelog: [
        'Enhanced validation with domain rules',
        'Circuit breaker pattern for external APIs',
        'Audit logging for all operations',
        'Health checks and monitoring',
        'Event-driven architecture improvements',
      ],
      breakingChanges: [
        'Some validation rules are now stricter',
        'Response formats may include additional metadata',
      ],
    }],
  ]);

  /**
   * Get all available API versions
   */
  getAvailableVersions(): ApiVersion[] {
    return Array.from(this.versions.values());
  }

  /**
   * Get a specific API version
   */
  getVersion(version: string): ApiVersion | null {
    return this.versions.get(version) || null;
  }

  /**
   * Get the default API version
   */
  getDefaultVersion(): ApiVersion {
    return Array.from(this.versions.values()).find(v => v.isDefault) ||
           this.versions.get('v1')!;
  }

  /**
   * Check version compatibility and provide migration guidance
   */
  checkCompatibility(requestedVersion: string): VersionCompatibility {
    const requested = this.versions.get(requestedVersion);
    const defaultVersion = this.getDefaultVersion();

    if (!requested) {
      return {
        requestedVersion,
        resolvedVersion: defaultVersion.version,
        isCompatible: false,
        warnings: [`Version ${requestedVersion} is not available. Using default version ${defaultVersion.version}.`],
        suggestedVersion: defaultVersion.version,
      };
    }

    if (requested.isDeprecated) {
      const warnings = [`Version ${requestedVersion} is deprecated.`];

      if (requested.sunsetDate) {
        warnings.push(`This version will be sunset on ${requested.sunsetDate.toISOString().split('T')[0]}.`);
      }

      warnings.push(`Consider upgrading to ${defaultVersion.version}.`);

      return {
        requestedVersion,
        resolvedVersion: requestedVersion,
        isCompatible: true,
        warnings,
        suggestedVersion: defaultVersion.version,
      };
    }

    return {
      requestedVersion,
      resolvedVersion: requestedVersion,
      isCompatible: true,
      warnings: [],
    };
  }

  /**
   * Negotiate the best version based on client preferences
   */
  negotiateVersion(acceptHeader?: string, queryParam?: string): string {
    // Check query parameter first
    if (queryParam && this.versions.has(queryParam)) {
      return queryParam;
    }

    // Parse Accept header for version negotiation
    if (acceptHeader) {
      const versions = this.parseAcceptHeader(acceptHeader);
      for (const version of versions) {
        if (this.versions.has(version)) {
          return version;
        }
      }
    }

    // Return default version
    return this.getDefaultVersion().version;
  }

  /**
   * Parse Accept header for version preferences
   */
  private parseAcceptHeader(acceptHeader: string): string[] {
    // Simple parsing for version negotiation
    // Format: application/vnd.api.v1+json, application/vnd.api.v2+json
    const versionMatches = acceptHeader.match(/vnd\.api\.(\w+)\+json/g);

    if (versionMatches) {
      return versionMatches.map(match => match.replace(/vnd\.api\.(.+)\+json/, '$1'));
    }

    return [];
  }

  /**
   * Get version-specific features
   */
  getVersionFeatures(version: string): Record<string, any> {
    const versionInfo = this.versions.get(version);
    if (!versionInfo) return {};

    return {
      version: versionInfo.version,
      features: {
        auditLogging: version >= 'v2',
        circuitBreaker: version >= 'v2',
        enhancedValidation: version >= 'v2',
        healthChecks: version >= 'v2',
        eventStreaming: version >= 'v2',
      },
      limits: {
        maxRequestsPerMinute: version === 'v1' ? 60 : 120,
        maxConcurrentRequests: version === 'v1' ? 10 : 20,
      },
    };
  }

  /**
   * Log version usage for analytics
   */
  logVersionUsage(version: string, endpoint: string, userAgent?: string): void {
    this.logger.debug(`API Version ${version} used for ${endpoint}`, {
      version,
      endpoint,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  }
}
