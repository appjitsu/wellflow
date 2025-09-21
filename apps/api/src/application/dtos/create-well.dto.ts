import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  ValidateNested,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WellType } from '../../domain/enums/well-status.enum';

class LocationDto {
  @ApiProperty({ description: 'Latitude', example: 32.7767 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ description: 'Longitude', example: -96.797 })
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ description: 'Street address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'County name', required: false })
  @IsOptional()
  @IsString()
  county?: string;

  @ApiProperty({ description: 'State code', required: false, example: 'TX' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Country code', required: false, example: 'US' })
  @IsOptional()
  @IsString()
  country?: string;
}

/**
 * Create Well Request DTO
 * Used for API requests to create a new well
 */
export class CreateWellDto {
  @ApiProperty({ description: 'API Number (10 digits)', example: '4212312345' })
  @IsString()
  @IsNotEmpty()
  apiNumber!: string;

  @ApiProperty({ description: 'Well name', example: 'Smith #1' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'Operator ID' })
  @IsString()
  @IsNotEmpty()
  operatorId!: string;

  @ApiProperty({ enum: WellType, description: 'Type of well' })
  @IsEnum(WellType)
  wellType!: WellType;

  @ApiProperty({ description: 'Well location' })
  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @ApiProperty({ description: 'Lease ID', required: false })
  @IsOptional()
  @IsString()
  leaseId?: string;

  @ApiProperty({ description: 'Spud date', required: false })
  @IsOptional()
  @IsDateString()
  spudDate?: string;

  @ApiProperty({ description: 'Total depth in feet', required: false })
  @IsOptional()
  @IsNumber()
  totalDepth?: number;
}
