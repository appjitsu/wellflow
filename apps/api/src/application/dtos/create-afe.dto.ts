import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AfeType } from '../../domain/enums/afe-status.enum';

/**
 * Create AFE Data Transfer Object
 * Used for API request validation and documentation
 */
export class CreateAfeDto {
  @ApiProperty({
    description: 'AFE number (unique within organization)',
    example: 'AFE-2024-0001',
  })
  @IsString()
  afeNumber!: string;

  @ApiProperty({
    description: 'Type of AFE',
    enum: AfeType,
    example: AfeType.DRILLING,
  })
  @IsEnum(AfeType)
  afeType!: AfeType;

  @ApiPropertyOptional({
    description: 'Well ID associated with this AFE',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  wellId?: string;

  @ApiPropertyOptional({
    description: 'Lease ID associated with this AFE',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  leaseId?: string;

  @ApiPropertyOptional({
    description: 'Total estimated cost in USD',
    example: 1500000.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalEstimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Description of the AFE',
    example: 'Drilling and completion of Well ABC-123',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
