import { ICommand } from '@nestjs/cqrs';

/**
 * Recalculate Revenue Distribution Command
 * Command to recalculate revenue distribution based on updated production or pricing data
 */
export class RecalculateRevenueDistributionCommand implements ICommand {
  constructor(
    public readonly revenueDistributionId: string,
    public readonly productionVolumes: {
      oilVolume?: number;
      gasVolume?: number;
    },
    public readonly revenueBreakdown: {
      oilRevenue?: number;
      gasRevenue?: number;
      totalRevenue: number;
      severanceTax?: number;
      adValorem?: number;
      transportationCosts?: number;
      processingCosts?: number;
      otherDeductions?: number;
      netRevenue: number;
    },
    public readonly calculatedBy: string,
    public readonly reason?: string,
  ) {}
}
