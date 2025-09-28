import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Forgot Password Request DTO
 * Validates forgot password request data
 *
 * Follows established DTO patterns in the codebase with:
 * - Class-validator decorators for validation
 * - Swagger API documentation
 * - Strong TypeScript typing (no 'any' types)
 */
export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address to send password reset link',
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  readonly email!: string;
}

/**
 * Forgot Password Response DTO
 * Response structure for forgot password requests
 */
export class ForgotPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example:
      'If an account with that email exists, a password reset link has been sent.',
  })
  readonly message!: string;

  @ApiProperty({
    description: 'Timestamp when the request was processed',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  readonly sentAt!: Date;
}
