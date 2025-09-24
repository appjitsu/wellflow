import { ApiProperty } from '@nestjs/swagger';
import { DivisionOrder } from '../../domain/entities/division-order.entity';

/**
 * Division Order Data Transfer Object
 * Used for API responses
 */
export class DivisionOrderDto {
  @ApiProperty({ description: 'Division order unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId!: string;

  @ApiProperty({ description: 'Well ID' })
  wellId!: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId!: string;

  @ApiProperty({
    description: 'Decimal interest (8 decimal places)',
    example: '0.12500000',
  })
  decimalInterest!: string;

  @ApiProperty({
    description: 'Decimal interest as percentage',
    example: '12.500000%',
  })
  decimalInterestPercentage!: string;

  @ApiProperty({ description: 'Effective date' })
  effectiveDate!: Date;

  @ApiProperty({ description: 'End date (optional)', required: false })
  endDate?: Date;

  @ApiProperty({ description: 'Whether the division order is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Version for optimistic locking' })
  version!: number;

  static fromEntity(divisionOrder: DivisionOrder): DivisionOrderDto {
    return {
      id: divisionOrder.getId(),
      organizationId: divisionOrder.getOrganizationId(),
      wellId: divisionOrder.getWellId(),
      partnerId: divisionOrder.getPartnerId(),
      decimalInterest: divisionOrder.getDecimalInterest().getFormattedDecimal(),
      decimalInterestPercentage: divisionOrder
        .getDecimalInterest()
        .getFormattedPercentage(),
      effectiveDate: divisionOrder.getEffectiveDate(),
      endDate: divisionOrder.getEndDate(),
      isActive: divisionOrder.isActive(),
      createdAt: divisionOrder.getCreatedAt(),
      updatedAt: divisionOrder.getUpdatedAt(),
      version: divisionOrder.getVersion(),
    };
  }
}

/**
 * Decimal Interest Summary DTO
 * Used for well decimal interest summary responses
 */
export class DecimalInterestSummaryDto {
  @ApiProperty({ description: 'Well ID' })
  wellId!: string;

  @ApiProperty({
    description: 'Total decimal interest',
    example: '1.00000000',
  })
  totalInterest!: string;

  @ApiProperty({
    description: 'Total decimal interest as percentage',
    example: '100.000000%',
  })
  totalInterestPercentage!: string;

  @ApiProperty({ description: 'Whether total equals 100%' })
  isValid!: boolean;

  @ApiProperty({ description: 'Effective date used for calculation' })
  effectiveDate!: Date;

  @ApiProperty({
    description: 'Partner interests breakdown',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        partnerId: { type: 'string' },
        decimalInterest: { type: 'string' },
        decimalInterestPercentage: { type: 'string' },
        divisionOrderId: { type: 'string' },
      },
    },
  })
  partnerInterests!: Array<{
    partnerId: string;
    decimalInterest: string;
    decimalInterestPercentage: string;
    divisionOrderId: string;
  }>;
}
