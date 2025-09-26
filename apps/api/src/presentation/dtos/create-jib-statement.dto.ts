import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DecimalPrecision } from '../validators/decimal-precision.decorator';

export class JibLineItemDto {
  @ApiProperty({ enum: ['revenue', 'expense'] })
  @IsIn(['revenue', 'expense'])
  type!: 'revenue' | 'expense';

  @ApiProperty({ description: 'Line item description' })
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Amount (12,2) as string',
    required: false,
    example: '100.00',
  })
  @IsOptional()
  @DecimalPrecision(12, 2)
  amount?: string;

  @ApiProperty({
    description: 'Quantity (up to 3 dp) as string',
    required: false,
    example: '2',
  })
  @IsOptional()
  @DecimalPrecision(9, 3)
  quantity?: string;

  @ApiProperty({
    description: 'Unit cost (12,2) as string',
    required: false,
    example: '50.00',
  })
  @IsOptional()
  @DecimalPrecision(12, 2)
  unitCost?: string;
}

export class CreateJibStatementDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ description: 'Lease ID' })
  @IsNotEmpty()
  leaseId!: string;

  @ApiProperty({ description: 'Partner ID' })
  @IsNotEmpty()
  partnerId!: string;

  @ApiProperty({ description: 'Statement period start (YYYY-MM-DD)' })
  @IsDateString()
  statementPeriodStart!: string;

  @ApiProperty({ description: 'Statement period end (YYYY-MM-DD)' })
  @IsDateString()
  statementPeriodEnd!: string;

  @ApiProperty({ description: 'Due date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  // Optional financial fields
  @ApiProperty({
    description: 'Gross revenue (12,2)',
    required: false,
    example: '1000.00',
  })
  @IsOptional()
  @DecimalPrecision(12, 2)
  grossRevenue?: string;

  @ApiProperty({
    description: 'Net revenue (12,2)',
    required: false,
    example: '800.00',
  })
  @IsOptional()
  @DecimalPrecision(12, 2)
  netRevenue?: string;

  @ApiProperty({
    description: 'Working interest share percent (0-100, 2dp)',
    required: false,
    example: '50.00',
  })
  @IsOptional()
  @DecimalPrecision(5, 2)
  workingInterestShare?: string;

  @ApiProperty({
    description: 'Royalty share percent (0-100, 2dp)',
    required: false,
    example: '12.50',
  })
  @IsOptional()
  @DecimalPrecision(5, 2)
  royaltyShare?: string;

  @ApiProperty({
    description: 'Previous balance (12,2)',
    required: false,
    example: '0.00',
  })
  @IsOptional()
  @DecimalPrecision(12, 2)
  previousBalance?: string;

  @ApiProperty({
    description: 'Current balance (12,2)',
    required: false,
    example: '0.00',
  })
  @IsOptional()
  @DecimalPrecision(12, 2)
  currentBalance?: string;

  @ApiProperty({
    description: 'Line items',
    required: false,
    type: [JibLineItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JibLineItemDto)
  lineItems?: JibLineItemDto[] | null;

  @ApiProperty({
    description: 'Initial status',
    required: false,
    enum: ['draft', 'sent', 'paid'],
  })
  @IsOptional()
  @IsIn(['draft', 'sent', 'paid'])
  status?: 'draft' | 'sent' | 'paid';

  @ApiProperty({ description: 'Sent at ISO timestamp', required: false })
  @IsOptional()
  @IsDateString()
  sentAt?: string | null;

  @ApiProperty({ description: 'Paid at ISO timestamp', required: false })
  @IsOptional()
  @IsDateString()
  paidAt?: string | null;
}
