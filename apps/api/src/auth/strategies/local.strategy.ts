import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from './jwt.strategy';

interface RequestWithHeaders {
  headers: Record<string, string | string[] | undefined>;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  ip?: string;
}

/**
 * Local Strategy
 * Validates email/password credentials for login
 *
 * This strategy integrates with the established Strategy pattern
 * used throughout the codebase and handles the login flow
 * with proper security measures including account lockout
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Use email instead of username
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords
      passwordField: 'password',
      passReqToCallback: true, // Pass request object to validate method
    });
  }

  /**
   * Validate user credentials
   * This method is called by Passport during login attempts
   *
   * @param request - Express request object (for IP tracking)
   * @param email - User's email address
   * @param password - User's plain text password
   * @returns AuthenticatedUser object or throws UnauthorizedException
   */
  async validate(
    request: RequestWithHeaders,
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    try {
      // Extract client information for security logging
      const ipAddress = this.extractIpAddress(request);
      const userAgent = request.headers['user-agent'] as string | undefined;

      // Validate credentials using AuthService
      const user = await this.authService.validateUserCredentials(
        email,
        password,
        ipAddress,
        userAgent,
      );

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Return user information for JWT token generation
      return {
        id: user.getId(),
        email: user.getEmail().getValue(),
        organizationId: user.getOrganizationId(),
        role: user.getRole(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        isEmailVerified: user.isEmailVerified(),
        lastLoginAt: user.getLastLoginAt(),
      };
    } catch (error) {
      // Log failed login attempts for security monitoring
      console.warn('Local authentication failed:', {
        email,
        ipAddress: this.extractIpAddress(request),
        userAgent: request.headers['user-agent'],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Get strategy name for Passport registration
   */
  getStrategyName(): string {
    return 'local';
  }

  /**
   * Extract client IP address from request
   * Handles various proxy configurations
   */
  private extractIpAddress(request: RequestWithHeaders): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIp = request.headers['x-real-ip'];
    const remoteAddress =
      request.connection?.remoteAddress || request.socket?.remoteAddress;

    if (typeof forwarded === 'string') {
      // X-Forwarded-For can contain multiple IPs, take the first one
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }

    if (typeof realIp === 'string') {
      return realIp;
    }

    return remoteAddress || 'unknown';
  }
}
