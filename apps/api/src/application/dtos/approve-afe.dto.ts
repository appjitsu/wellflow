import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Approve AFE Data Transfer Object
 * Used for API request validation when approving AFEs
 */
export class ApproveAfeDto {
  @ApiPropertyOptional({
    description: 'Approved amount in USD (if different from estimated)',
    example: 1400000.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  approvedAmount?: number;

  @ApiPropertyOptional({
    description: 'Comments or notes about the approval',
    example: 'Approved with reduced scope for Phase 1',
  })
  @IsOptional()
  @IsString()
  comments?: string;
}
