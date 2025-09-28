import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  Query,
  HttpException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService, RegisterUserDto } from './auth.service';
import { LoginDto } from './dto/login.dto';

// eslint-disable-next-line sonarjs/no-duplicate-string
const EXAMPLE_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
import { RegisterDto } from './dto/register.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
  EmailVerificationResponseDto,
  AuthErrorResponseDto,
} from './dto/auth-response.dto';
import {
  RefreshTokenDto,
  RefreshTokenResponseDto,
} from './dto/refresh-token.dto';
import {
  ChangePasswordDto,
  ChangePasswordResponseDto,
} from './dto/change-password.dto';
import {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
} from './dto/forgot-password.dto';
import {
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from './dto/reset-password.dto';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { RATE_LIMIT_TIERS } from '../common/throttler';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../presentation/guards/jwt-auth.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import { CheckAbilities } from '../authorization/abilities.decorator';

/**
 * Authentication Controller
 *
 * Handles user authentication endpoints following established patterns:
 * - Uses Swagger documentation
 * - Implements rate limiting for security
 * - Follows REST conventions
 * - Integrates with existing guard system
 * - Uses proper HTTP status codes
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User Registration
   * Creates a new user account with email verification
   */
  @Post('register')
  @Public() // Bypass JWT authentication for registration
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ [RATE_LIMIT_TIERS.AUTH]: { limit: 10, ttl: 60000 } }) // Strict rate limiting for registration
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account. Email verification is required before login.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration data',
    type: AuthErrorResponseDto,
  })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    const registerData: RegisterUserDto = {
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      organizationId: registerDto.organizationId,
      role: registerDto.role,
      phone: registerDto.phone,
      createOrganization: registerDto.createOrganization,
      organizationName: registerDto.organizationName,
      organizationContactEmail: registerDto.organizationContactEmail,
      organizationContactPhone: registerDto.organizationContactPhone,
    };

    const user = await this.authService.register(registerData);

    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.getId(),
        email: user.getEmail().getValue(),
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        role: user.getRole(),
        organizationId: user.getOrganizationId(),
        isEmailVerified: user.isEmailVerified(),
        lastLoginAt: user.getLastLoginAt(),
      },
      requiresEmailVerification: true,
      organizationName: registerDto.organizationName,
      organizationCreated: Boolean(registerDto.createOrganization),
    };
  }

  /**
   * User Login
   * Authenticates user credentials and returns JWT tokens
   */
  @Post('login')
  @Public() // Bypass JWT authentication for login
  @UseGuards(AuthGuard('local')) // Use Local Strategy for credential validation
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.AUTH]: { limit: 10, ttl: 60000 } }) // Moderate rate limiting for login
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticates user credentials and returns JWT access and refresh tokens.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account locked',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many login attempts',
    type: AuthErrorResponseDto,
  })
  async login(
    @Request() req: { user: AuthenticatedUser },
    @Body() loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    // User is already validated by LocalStrategy
    return this.authService.login(req.user, loginDto.rememberMe || false);
  }

  /**
   * Email Verification
   * Verifies user email address using verification token
   */
  @Post('verify-email/:userId')
  @Public() // Public endpoint for email verification
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.DEFAULT]: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verifies user email address using the verification token sent via email.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: EXAMPLE_USER_ID,
  })
  @ApiQuery({
    name: 'token',
    description: 'Email verification token',
    example: 'abc123def456ghi789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: EmailVerificationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired verification token',
    type: AuthErrorResponseDto,
  })
  async verifyEmail(
    @Param('userId') userId: string,
    @Query('token') token: string,
  ): Promise<EmailVerificationResponseDto> {
    await this.authService.verifyEmail(userId, token);

    return {
      message: 'Email verified successfully. You can now log in.',
      verifiedAt: new Date(),
    };
  }

  /**
   * Resend Email Verification
   * Resends verification email to user
   */
  @Post('resend-verification/:userId')
  @Public() // Public endpoint for resending verification
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 3, ttl: 300000 } }) // Very strict rate limiting - 3 per 5 minutes
  @ApiOperation({
    summary: 'Resend email verification',
    description:
      'Resends the email verification token to the user. Rate limited to prevent abuse.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        sentAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email already verified',
    type: AuthErrorResponseDto,
  })
  async resendVerificationEmail(
    @Param('userId') userId: string,
  ): Promise<{ message: string; sentAt: Date }> {
    await this.authService.resendVerificationEmail(userId);

    return {
      message: 'Verification email sent successfully. Please check your inbox.',
      sentAt: new Date(),
    };
  }

  /**
   * Get Current User Profile
   * Returns the authenticated user's profile information
   */
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Returns the authenticated user's profile information.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'john.doe@example.com' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        role: { type: 'string', example: 'manager' },
        organizationId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        isEmailVerified: { type: 'boolean', example: true },
        lastLoginAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired token',
    type: AuthErrorResponseDto,
  })
  getProfile(@Request() req: { user: AuthenticatedUser }) {
    return {
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      organizationId: req.user.organizationId,
      isEmailVerified: req.user.isEmailVerified,
      lastLoginAt: req.user.lastLoginAt,
    };
  }

  /**
   * Logout (placeholder for future refresh token blacklisting)
   * Currently returns success message
   */
  @Post('logout')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description: 'Logs out the user (future: blacklists refresh token).',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout successful' },
      },
    },
  })
  logout(@Request() _req: { user: AuthenticatedUser }) {
    // Note: Refresh token blacklisting will be implemented in Phase 4
    // For now, client-side token removal is sufficient
    return {
      message: 'Logout successful',
    };
  }

  /**
   * Unlock User Account (Admin Only)
   * Manually unlock a locked user account
   */
  @Post('unlock-account/:userId')
  @UseGuards(JwtAuthGuard, AbilitiesGuard)
  @CheckAbilities({ action: 'update', subject: 'User' })
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Unlock user account (Admin only)',
    description:
      'Manually unlock a user account that has been locked due to failed login attempts. Requires admin privileges.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID to unlock',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account unlocked successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
    type: AuthErrorResponseDto,
  })
  async unlockAccount(
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.authService.unlockUserAccount(userId);
    return { message: 'Account unlocked successfully' };
  }

  /**
   * Change Password
   * Allows authenticated users to change their password
   */
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Allows authenticated users to change their password by providing current password and new password.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid password data or passwords do not match',
    type: AuthErrorResponseDto,
  })
  async changePassword(
    @Request() req: { user: AuthenticatedUser },
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ChangePasswordResponseDto> {
    // Validate password confirmation
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new HttpException(
        'New password and confirmation do not match',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Password changed successfully',
      changedAt: new Date(),
    };
  }

  /**
   * Refresh Access Token
   * Generates new access and refresh tokens using a valid refresh token
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.DEFAULT]: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Generates new access and refresh tokens using a valid refresh token. Implements token rotation for security.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    type: AuthErrorResponseDto,
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * Forgot Password
   * Initiates password reset process by sending reset email
   */
  @Post('forgot-password')
  @Public() // Public endpoint for password reset
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 3, ttl: 300000 } }) // Very strict rate limiting - 3 per 5 minutes
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Initiates password reset process. If the email exists, a reset link will be sent. Rate limited to prevent abuse.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent (if account exists)',
    type: ForgotPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Too many password reset requests',
    type: AuthErrorResponseDto,
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    await this.authService.forgotPassword(forgotPasswordDto.email);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
      sentAt: new Date(),
    };
  }

  /**
   * Reset Password
   * Resets password using token from email
   */
  @Post('reset-password')
  @Public() // Public endpoint for password reset
  @HttpCode(HttpStatus.OK)
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 5, ttl: 300000 } }) // 5 attempts per 5 minutes
  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Resets user password using the token from the reset email. Validates password complexity and history.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid token, password validation failed, or password reused',
    type: AuthErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: AuthErrorResponseDto,
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    // Validate password confirmation
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new HttpException(
        'New password and confirmation do not match',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.resetPassword(
      resetPasswordDto.userId,
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    return {
      message:
        'Password has been reset successfully. You can now log in with your new password.',
      resetAt: new Date(),
    };
  }
}
