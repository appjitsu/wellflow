import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update AFE Cost Data Transfer Object
 * Used for API request validation when updating AFE costs
 */
export class UpdateAfeCostDto {
  @ApiPropertyOptional({
    description: 'Updated estimated cost in USD',
    example: 1600000.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Actual cost incurred in USD',
    example: 1550000.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;
}
