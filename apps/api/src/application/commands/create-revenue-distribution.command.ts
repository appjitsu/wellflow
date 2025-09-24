import { ICommand } from '@nestjs/cqrs';

/**
 * Create Revenue Distribution Command
 * Command to create a new revenue distribution for a well and partner
 */
export class CreateRevenueDistributionCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly divisionOrderId: string,
    public readonly productionMonth: string, // YYYY-MM format
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
    public readonly createdBy?: string,
  ) {}
}
