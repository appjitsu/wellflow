import { ICommand } from '@nestjs/cqrs';
import { AfeType } from '../../domain/enums/afe-status.enum';

/**
 * Create AFE Command
 * Command to create a new Authorization for Expenditure
 */
export class CreateAfeCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly afeNumber: string,
    public readonly afeType: AfeType,
    public readonly wellId?: string,
    public readonly leaseId?: string,
    public readonly totalEstimatedCost?: number,
    public readonly description?: string,
    public readonly createdBy?: string,
  ) {}
}
