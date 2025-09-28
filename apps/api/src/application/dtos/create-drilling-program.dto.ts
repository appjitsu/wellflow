import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { DrillingProgramStatus } from '../../domain/enums/drilling-program-status.enum';

export class CreateDrillingProgramDto {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  programName!: string;

  @ApiProperty({ enum: DrillingProgramStatus, required: false })
  @IsOptional()
  @IsEnum(DrillingProgramStatus)
  status?: DrillingProgramStatus;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  program?: Record<string, unknown>;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  hazards?: Record<string, unknown>;

  @ApiProperty({ required: false, type: Array })
  @IsOptional()
  approvals?: Array<Record<string, unknown>>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;
}
