import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { WorkoverStatus } from '../../domain/enums/workover-status.enum';

export class CreateWorkoverDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  wellId!: string;

  @ApiProperty({ format: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  afeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ enum: WorkoverStatus, required: false })
  @IsOptional()
  @IsEnum(WorkoverStatus)
  status?: WorkoverStatus;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  preProductionSnapshot?: Record<string, unknown>;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  postProductionSnapshot?: Record<string, unknown>;
}
