import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Reject AFE Data Transfer Object
 * Used for API request validation when rejecting AFEs
 */
export class RejectAfeDto {
  @ApiPropertyOptional({
    description: 'Reason for rejection',
    example: 'Cost exceeds budget allocation for this quarter',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
