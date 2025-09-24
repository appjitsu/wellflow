import { ICommand } from '@nestjs/cqrs';

/**
 * Update Division Order Command
 * Command to update an existing division order's decimal interest
 */
export class UpdateDivisionOrderCommand implements ICommand {
  constructor(
    public readonly divisionOrderId: string,
    public readonly decimalInterest: number,
    public readonly effectiveDate: Date,
    public readonly updatedBy: string,
    public readonly reason?: string,
  ) {}
}
