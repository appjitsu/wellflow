import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Change Password DTO
 * Validates password change request data
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'CurrentPass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, {
    message: 'Current password must be at least 8 characters long',
  })
  @MaxLength(128, { message: 'Current password cannot exceed 128 characters' })
  currentPassword!: string;

  @ApiProperty({
    description: 'New password meeting security requirements',
    example: 'NewSecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(128, { message: 'New password cannot exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
  })
  newPassword!: string;

  @ApiProperty({
    description: 'Confirmation of new password',
    example: 'NewSecurePass123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, {
    message: 'Password confirmation must be at least 8 characters long',
  })
  @MaxLength(128, {
    message: 'Password confirmation cannot exceed 128 characters',
  })
  confirmPassword!: string;
}

/**
 * Change Password Response DTO
 */
export class ChangePasswordResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Password changed successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Timestamp when password was changed',
    example: '2024-01-15T10:30:00.000Z',
  })
  changedAt!: Date;
}
