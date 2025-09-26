import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * JWT Payload Interface
 * Defines the structure of JWT token payload
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  organizationId: string;
  role: string;
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Authenticated User Interface
 * Represents the user object attached to requests after JWT validation
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  lastLoginAt?: Date;
}

/**
 * JWT Strategy
 * Validates JWT tokens and attaches user information to requests
 *
 * This strategy integrates with the existing JwtAuthGuard and follows
 * the established Strategy pattern used throughout the codebase
 * (similar to PaymentCalculationStrategy, PricingStrategy, etc.)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    // Validate JWT secret is configured
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'], // Explicit algorithm specification for security
    });
  }

  /**
   * Validate JWT payload and return user information
   * This method is called by Passport after JWT signature verification
   *
   * @param payload - Decoded JWT payload
   * @returns AuthenticatedUser object or throws UnauthorizedException
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    try {
      // Validate payload structure
      if (
        !payload.sub ||
        !payload.email ||
        !payload.organizationId ||
        !payload.role
      ) {
        throw new UnauthorizedException('Invalid token payload structure');
      }

      // Get user from database to ensure they still exist and are active
      const user = await this.authService.validateUserById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Verify the payload data matches current user data
      if (
        user.getEmail().getValue() !== payload.email ||
        user.getOrganizationId() !== payload.organizationId
      ) {
        throw new UnauthorizedException(
          'Token payload does not match user data',
        );
      }

      // Check if user account is locked
      if (user.isAccountLocked()) {
        throw new UnauthorizedException('User account is locked');
      }

      // Check if user account is active
      if (!user.isAccountActive()) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Return user information that will be attached to request.user
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
      // Log security events for monitoring
      console.warn('JWT validation failed:', {
        userId: payload.sub,
        email: payload.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * Get strategy name for Passport registration
   */
  getStrategyName(): string {
    return 'jwt';
  }
}
