import { ICommand } from '@nestjs/cqrs';

/**
 * Update AFE Cost Command
 * Command to update AFE estimated or actual costs
 */
export class UpdateAfeCostCommand implements ICommand {
  constructor(
    public readonly afeId: string,
    public readonly estimatedCost?: number,
    public readonly actualCost?: number,
    public readonly updatedBy?: string,
  ) {}
}
