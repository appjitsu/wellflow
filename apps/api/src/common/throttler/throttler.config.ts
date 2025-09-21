import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

/**
 * Rate Limiting Configuration for WellFlow API
 *
 * Designed for critical oil & gas infrastructure with security-first approach:
 * - Conservative limits to prevent abuse while allowing legitimate operations
 * - Tiered limits based on endpoint sensitivity
 * - Redis storage for distributed rate limiting
 *
 * Industry Compliance:
 * - NIST Cybersecurity Framework: Access Control (PR.AC)
 * - IEC 62443: Security Level 2-3 requirements
 * - API 1164: Pipeline SCADA security controls
 */

/**
 * Configuration factory for throttling using ConfigService
 * Supports environment-specific rate limits for different deployment scenarios
 */
export const createThrottlerConfig = (
  configService: ConfigService,
): ThrottlerModuleOptions => ({
  // Redis configuration would be used here for distributed throttling
  // Currently using in-memory throttling for simplicity
  // Future enhancement: Accept ConfigService parameter for dynamic configuration
  throttlers: [
    {
      name: 'default',
      // Default: Configurable requests per minute for general API operations
      // Suitable for regular data retrieval and monitoring
      ttl: configService.get<number>('RATE_LIMIT_TTL', 60000), // 1 minute default
      limit: configService.get<number>('RATE_LIMIT_DEFAULT', 60),
    },
    {
      name: 'strict',
      // Strict: Reduced limit for sensitive operations
      // Applied to data modification endpoints
      ttl: configService.get<number>('RATE_LIMIT_TTL', 60000), // 1 minute default
      limit: configService.get<number>('RATE_LIMIT_STRICT', 30),
    },
    {
      name: 'auth',
      // Authentication: Low limit to prevent brute force attacks
      // Critical for preventing unauthorized access attempts
      ttl: configService.get<number>('RATE_LIMIT_TTL', 60000), // 1 minute default
      limit: configService.get<number>('RATE_LIMIT_AUTH', 10),
    },
    {
      name: 'monitoring',
      // Monitoring: Higher limit for health checks and operational monitoring
      // Supports frequent monitoring needs
      ttl: configService.get<number>('RATE_LIMIT_TTL', 60000), // 1 minute default
      limit: configService.get<number>('RATE_LIMIT_MONITORING', 100),
    },
  ],
  // Note: Redis storage configuration will be handled by a custom storage provider
  // For now, using default in-memory storage
});

/**
 * Rate Limiting Tiers for Different Endpoint Types
 *
 * These constants define the security tiers used throughout the application:
 */
export const RATE_LIMIT_TIERS = {
  // Health and monitoring endpoints - frequent access needed
  MONITORING: 'monitoring',

  // General data retrieval - moderate limits
  DEFAULT: 'default',

  // Data modification and sensitive operations - strict limits
  STRICT: 'strict',

  // Authentication and authorization - very strict limits
  AUTH: 'auth',
} as const;

/**
 * Custom rate limiting messages for different scenarios
 */
export const RATE_LIMIT_MESSAGES = {
  DEFAULT: 'Rate limit exceeded. Please try again later.',
  AUTH: 'Too many authentication attempts. Please wait before trying again.',
  STRICT:
    'Rate limit exceeded for sensitive operations. Please wait before trying again.',
  MONITORING:
    'Monitoring rate limit exceeded. Please reduce request frequency.',
} as const;
