import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export type AmendmentType = 'ORIGINAL' | 'CORRECTED' | 'AMENDED';

export class SubmitRegulatoryReportRequestDto {
  @ApiPropertyOptional({
    description: 'Submission type per regulator semantics',
    enum: ['ORIGINAL', 'CORRECTED', 'AMENDED'],
    example: 'ORIGINAL',
    default: 'ORIGINAL',
  })
  @IsOptional()
  @IsEnum(['ORIGINAL', 'CORRECTED', 'AMENDED'])
  amendmentType?: AmendmentType;
}
