import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class RecordCashCallConsentDto {
  @ApiProperty({ description: 'Organization ID', example: 'org-123' })
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ enum: ['RECEIVED', 'WAIVED'], example: 'RECEIVED' })
  @IsEnum(['RECEIVED', 'WAIVED'] as const)
  status!: 'RECEIVED' | 'WAIVED';

  @ApiProperty({
    description: 'Consent received date (YYYY-MM-DD)',
    required: false,
    example: '2025-01-15',
  })
  @IsOptional()
  @IsDateString()
  receivedAt?: string | null;
}
