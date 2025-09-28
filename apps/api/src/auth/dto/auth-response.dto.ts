import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User Response DTO
 * Represents user information in API responses
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: 'User role',
    example: 'manager',
  })
  role!: string;

  @ApiProperty({
    description: 'Organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  organizationId!: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00Z',
    required: false,
  })
  lastLoginAt?: Date;
}

/**
 * Login Response DTO
 * Represents successful login response with tokens and user info
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user!: UserResponseDto;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  expiresIn!: number;
}

/**
 * Registration Response DTO
 * Represents successful registration response
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success message',
    example:
      'User registered successfully. Please check your email to verify your account.',
  })
  message!: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user!: UserResponseDto;

  @ApiProperty({
    description: 'Email verification required flag',
    example: true,
  })
  requiresEmailVerification!: boolean;

  @ApiPropertyOptional({
    description: 'Organization name (if created during registration)',
    example: 'Acme Oil & Gas Company',
  })
  organizationName?: string;

  @ApiPropertyOptional({
    description: 'Whether a new organization was created',
    example: true,
  })
  organizationCreated?: boolean;
}

/**
 * Email Verification Response DTO
 * Represents successful email verification response
 */
export class EmailVerificationResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully. You can now log in.',
  })
  message!: string;

  @ApiProperty({
    description: 'Verification timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  verifiedAt!: Date;
}

/**
 * Error Response DTO
 * Represents error responses from authentication endpoints
 */
export class AuthErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 401,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Invalid email or password',
  })
  message!: string;

  @ApiProperty({
    description: 'Error type/code',
    example: 'UNAUTHORIZED',
  })
  error!: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp!: string;
}
