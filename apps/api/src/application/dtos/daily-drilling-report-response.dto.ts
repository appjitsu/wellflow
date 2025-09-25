import { ApiProperty } from '@nestjs/swagger';

export class SubmitDailyDrillingReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: ['submitted'],
    default: 'submitted',
    example: 'submitted',
  })
  status!: 'submitted';
}

export class CreateDailyDrillingReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

export class DailyDrillingReportViewDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  wellId!: string;

  @ApiProperty({ type: 'string', description: 'YYYY-MM-DD' })
  reportDate!: string;
}
