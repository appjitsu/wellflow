import { SetMetadata, Version } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const API_VERSION_KEY = 'api_version';
export const API_VERSION_DEPRECATION_KEY = 'api_version_deprecated';

/**
 * API Version decorator for versioning endpoints
 */
export const ApiVersion = (version: string | number) => SetMetadata(API_VERSION_KEY, version);

/**
 * Mark an API version as deprecated
 */
export const ApiDeprecated = (message?: string, sunsetDate?: Date) =>
  SetMetadata(API_VERSION_DEPRECATION_KEY, { message, sunsetDate });

/**
 * Decorator for version-specific API documentation
 */
export const ApiVersionDocs = (options: {
  version: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  deprecatedMessage?: string;
  examples?: Record<string, any>;
}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const decorators = [];

    if (options.summary) {
      decorators.push(ApiOperation({
        summary: options.summary,
        description: options.description || `API Version ${options.version}`,
        deprecated: options.deprecated,
      }));
    }

    if (options.deprecated) {
      decorators.push(ApiResponse({
        status: 410,
        description: options.deprecatedMessage || `This API version (${options.version}) is deprecated and will be removed soon.`,
      }));
    }

    // Apply all decorators
    decorators.forEach(decorator => decorator(target, propertyKey, descriptor));
  };
};

/**
 * Version negotiation middleware
 */
export const VersionNegotiation = () => {
  return (req: any, res: any, next: any) => {
    // Extract version from various sources
    const version = req.headers['api-version'] ||
                   req.headers['accept-version'] ||
                   req.query.version ||
                   'v1';

    req.apiVersion = version;
    next();
  };
};
