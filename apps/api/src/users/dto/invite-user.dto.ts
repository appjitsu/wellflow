import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Invite User Request DTO
 * Validates user invitation data
 *
 * Follows established DTO patterns in the codebase with:
 * - Class-validator decorators for validation
 * - Swagger API documentation
 * - Strong TypeScript typing (no 'any' types)
 */
export class InviteUserDto {
  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 255,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  readonly email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    maxLength: 100,
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  readonly firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  readonly lastName!: string;

  @ApiProperty({
    description: 'User role in the organization',
    enum: ['owner', 'manager', 'pumper'],
    example: 'manager',
  })
  @IsEnum(['owner', 'manager', 'pumper'], {
    message: 'Role must be one of: owner, manager, pumper',
  })
  @IsNotEmpty({ message: 'Role is required' })
  readonly role!: 'owner' | 'manager' | 'pumper';

  @ApiProperty({
    description: 'Organization ID that the user will belong to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'Invalid organization ID format' })
  @IsNotEmpty({ message: 'Organization ID is required' })
  readonly organizationId!: string;
}
