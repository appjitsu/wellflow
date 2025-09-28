import {
  IsEmail,
  IsString,
  MaxLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update User Request DTO
 * Validates user update data (all fields optional)
 *
 * Follows established DTO patterns in the codebase with:
 * - Class-validator decorators for validation
 * - Swagger API documentation
 * - Strong TypeScript typing (no 'any' types)
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  readonly email?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  readonly firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  readonly lastName?: string;

  @ApiPropertyOptional({
    description: 'User role in the organization',
    enum: ['owner', 'manager', 'pumper'],
    example: 'manager',
  })
  @IsOptional()
  @IsEnum(['owner', 'manager', 'pumper'], {
    message: 'Role must be one of: owner, manager, pumper',
  })
  readonly role?: 'owner' | 'manager' | 'pumper';

  @ApiPropertyOptional({
    description: 'User phone number (optional)',
    example: '+1-555-123-4567',
    maxLength: 20,
  })
  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone cannot exceed 20 characters' })
  readonly phone?: string;

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  readonly isActive?: boolean;
}
