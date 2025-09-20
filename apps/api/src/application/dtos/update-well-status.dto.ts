import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WellStatus } from '../../domain/enums/well-status.enum';

/**
 * Update Well Status Request DTO
 * Used for API requests to update well status
 */
export class UpdateWellStatusDto {
  @ApiProperty({ enum: WellStatus, description: 'New well status' })
  @IsEnum(WellStatus)
  status: WellStatus;

  @ApiProperty({ description: 'Reason for status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
