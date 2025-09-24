import { ApiProperty } from '@nestjs/swagger';
import { RevenueDistribution } from '../../domain/entities/revenue-distribution.entity';

/**
 * Revenue Distribution Data Transfer Object
 * Used for API responses
 */
export class RevenueDistributionDto {
  @ApiProperty({ description: 'Revenue distribution unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId!: string;

  @ApiProperty({ description: 'Well ID' })
  wellId!: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId!: string;

  @ApiProperty({ description: 'Division order ID' })
  divisionOrderId!: string;

  @ApiProperty({
    description: 'Production month',
    example: '2024-03',
  })
  productionMonth!: string;

  @ApiProperty({ description: 'Production volumes' })
  productionVolumes!: {
    oilVolume?: number;
    gasVolume?: number;
  };

  @ApiProperty({ description: 'Revenue breakdown' })
  revenueBreakdown!: {
    oilRevenue?: number;
    gasRevenue?: number;
    totalRevenue: number;
    severanceTax?: number;
    adValorem?: number;
    transportationCosts?: number;
    processingCosts?: number;
    otherDeductions?: number;
    netRevenue: number;
  };

  @ApiProperty({ description: 'Payment information', required: false })
  paymentInfo?: {
    checkNumber?: string;
    paymentDate?: Date;
    paymentMethod?: string;
  };

  @ApiProperty({ description: 'Whether payment has been processed' })
  isPaid!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ description: 'Version for optimistic locking' })
  version!: number;

  static fromEntity(
    revenueDistribution: RevenueDistribution,
  ): RevenueDistributionDto {
    const paymentInfo = revenueDistribution.getPaymentInfo();
    const revenueBreakdown = revenueDistribution.getRevenueBreakdown();

    return {
      id: revenueDistribution.getId(),
      organizationId: revenueDistribution.getOrganizationId(),
      wellId: revenueDistribution.getWellId(),
      partnerId: revenueDistribution.getPartnerId(),
      divisionOrderId: revenueDistribution.getDivisionOrderId(),
      productionMonth: revenueDistribution
        .getProductionMonth()
        .getFormattedString(),
      productionVolumes: revenueDistribution.getProductionVolumes(),
      revenueBreakdown: {
        oilRevenue: revenueBreakdown.oilRevenue?.getAmount(),
        gasRevenue: revenueBreakdown.gasRevenue?.getAmount(),
        totalRevenue: revenueBreakdown.totalRevenue.getAmount(),
        severanceTax: revenueBreakdown.severanceTax?.getAmount(),
        adValorem: revenueBreakdown.adValorem?.getAmount(),
        transportationCosts: revenueBreakdown.transportationCosts?.getAmount(),
        processingCosts: revenueBreakdown.processingCosts?.getAmount(),
        otherDeductions: revenueBreakdown.otherDeductions?.getAmount(),
        netRevenue: revenueBreakdown.netRevenue.getAmount(),
      },
      paymentInfo:
        paymentInfo.checkNumber || paymentInfo.paymentDate
          ? {
              checkNumber: paymentInfo.checkNumber,
              paymentDate: paymentInfo.paymentDate,
              paymentMethod: paymentInfo.paymentMethod,
            }
          : undefined,
      isPaid: revenueDistribution.isPaid(),
      createdAt: revenueDistribution.getCreatedAt(),
      updatedAt: revenueDistribution.getUpdatedAt(),
      version: revenueDistribution.getVersion(),
    };
  }
}

/**
 * Revenue Summary DTO
 * Used for revenue summary responses
 */
export class RevenueSummaryDto {
  @ApiProperty({ description: 'Total revenue amount' })
  totalRevenue!: number;

  @ApiProperty({ description: 'Total deductions amount' })
  totalDeductions!: number;

  @ApiProperty({ description: 'Net revenue amount' })
  netRevenue!: number;

  @ApiProperty({ description: 'Number of distributions' })
  distributionCount!: number;

  @ApiProperty({ description: 'Number of paid distributions' })
  paidCount!: number;

  @ApiProperty({ description: 'Number of unpaid distributions' })
  unpaidCount!: number;

  @ApiProperty({
    description: 'Number of wells (for partner summary)',
    required: false,
  })
  wellCount?: number;

  @ApiProperty({
    description: 'Number of partners (for monthly summary)',
    required: false,
  })
  partnerCount?: number;

  @ApiProperty({ description: 'Paid amount', required: false })
  paidAmount?: number;

  @ApiProperty({ description: 'Unpaid amount', required: false })
  unpaidAmount?: number;
}

/**
 * Revenue Trends DTO
 * Used for revenue trends over time
 */
export class RevenueTrendsDto {
  @ApiProperty({
    description: 'Revenue trends by month',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        productionMonth: { type: 'string', example: '2024-03' },
        totalRevenue: { type: 'number' },
        netRevenue: { type: 'number' },
        distributionCount: { type: 'number' },
      },
    },
  })
  trends!: Array<{
    productionMonth: string;
    totalRevenue: number;
    netRevenue: number;
    distributionCount: number;
  }>;
}
