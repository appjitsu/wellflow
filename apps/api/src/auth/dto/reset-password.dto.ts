import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Reset Password Request DTO
 * Validates password reset request data
 *
 * Follows established DTO patterns in the codebase with:
 * - Class-validator decorators for validation
 * - Swagger API documentation
 * - Strong TypeScript typing (no 'any' types)
 * - Password complexity validation matching registration requirements
 */
export class ResetPasswordDto {
  @ApiProperty({
    description: 'User ID from the password reset link',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  readonly userId!: string;

  @ApiProperty({
    description: 'Password reset token from the email link',
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    minLength: 32,
    maxLength: 255,
  })
  @IsString({ message: 'Reset token must be a string' })
  @IsNotEmpty({ message: 'Reset token is required' })
  @MinLength(32, { message: 'Reset token must be at least 32 characters' })
  @MaxLength(255, { message: 'Reset token cannot exceed 255 characters' })
  readonly token!: string;

  @ApiProperty({
    description: 'New password meeting security requirements',
    example: 'NewSecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(128, { message: 'New password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
  })
  readonly newPassword!: string;

  @ApiProperty({
    description: 'Confirmation of new password',
    example: 'NewSecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString({ message: 'Password confirmation must be a string' })
  @MinLength(8, {
    message: 'Password confirmation must be at least 8 characters long',
  })
  @MaxLength(128, {
    message: 'Password confirmation cannot exceed 128 characters',
  })
  readonly confirmPassword!: string;
}

/**
 * Reset Password Response DTO
 * Response structure for password reset requests
 */
export class ResetPasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example:
      'Password has been reset successfully. You can now log in with your new password.',
  })
  readonly message!: string;

  @ApiProperty({
    description: 'Timestamp when the password was reset',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  readonly resetAt!: Date;
}
