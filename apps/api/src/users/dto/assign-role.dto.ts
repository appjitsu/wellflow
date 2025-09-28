import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Assign Role Request DTO
 * Validates role assignment data
 *
 * Follows established DTO patterns in the codebase with:
 * - Class-validator decorators for validation
 * - Swagger API documentation
 * - Strong TypeScript typing (no 'any' types)
 */
export class AssignRoleDto {
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
}
