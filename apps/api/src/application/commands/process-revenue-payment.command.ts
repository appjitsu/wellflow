import { ICommand } from '@nestjs/cqrs';

/**
 * Process Revenue Payment Command
 * Command to process payment for a revenue distribution
 */
export class ProcessRevenuePaymentCommand implements ICommand {
  constructor(
    public readonly revenueDistributionId: string,
    public readonly checkNumber: string,
    public readonly paymentDate: Date,
    public readonly processedBy: string,
  ) {}
}
