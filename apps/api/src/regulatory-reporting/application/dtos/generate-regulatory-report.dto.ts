import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';

export class GenerateRegulatoryReportRequestDto {
  @ApiProperty({ enum: ['TX'], example: 'TX' })
  @IsEnum(['TX'])
  jurisdiction!: 'TX';

  @ApiProperty({ enum: ['PR'], example: 'PR' })
  @IsEnum(['PR'])
  reportType!: 'PR';

  @ApiProperty({
    description: 'Reporting period in YYYY-MM format',
    example: '2025-06',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  period!: string;

  @ApiProperty({
    description: 'Organization ID (UUID) for which to generate the report',
  })
  @IsString()
  organizationId!: string;
}
