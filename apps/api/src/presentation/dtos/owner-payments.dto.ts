import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsIn, IsOptional, IsString, Matches } from 'class-validator';

const TWO_DECIMAL_PATTERN = /^-?\d+\.\d{2}$/;

export class CreateOwnerPaymentDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsUUID()
  partnerId!: string;

  @ApiProperty({ enum: ['CHECK', 'ACH', 'WIRE'] })
  @IsIn(['CHECK', 'ACH', 'WIRE'])
  method!: 'CHECK' | 'ACH' | 'WIRE';

  @ApiProperty({ description: 'Decimal string with 2 digits, e.g., 123.45' })
  @Matches(TWO_DECIMAL_PATTERN)
  grossAmount!: string;

  @ApiProperty({ description: 'Decimal string with 2 digits, e.g., 100.00' })
  @Matches(TWO_DECIMAL_PATTERN)
  netAmount!: string;

  @ApiProperty()
  @IsUUID()
  revenueDistributionId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(TWO_DECIMAL_PATTERN)
  deductionsAmount?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(TWO_DECIMAL_PATTERN)
  taxWithheldAmount?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  checkNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  achTraceNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  memo?: string;
}
