import { ICommand } from '@nestjs/cqrs';

/**
 * Create Division Order Command
 * Command to create a new division order for a well and partner
 */
export class CreateDivisionOrderCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly partnerId: string,
    public readonly decimalInterest: number,
    public readonly effectiveDate: Date,
    public readonly endDate?: Date,
    public readonly createdBy?: string,
  ) {}
}
