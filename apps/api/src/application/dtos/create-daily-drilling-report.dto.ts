import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDailyDrillingReportDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  wellId!: string;

  @ApiProperty({ description: 'YYYY-MM-DD' })
  @IsDateString()
  reportDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  depthMd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  depthTvd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rotatingHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  nptHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dayCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nextOperations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;
}
