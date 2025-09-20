import { ICommand } from '@nestjs/cqrs';
import { WellType } from '../../domain/enums/well-status.enum';

/**
 * Create Well Command
 * Command to create a new well
 */
export class CreateWellCommand implements ICommand {
  constructor(
    public readonly apiNumber: string,
    public readonly name: string,
    public readonly operatorId: string,
    public readonly wellType: WellType,
    public readonly location: {
      latitude: number;
      longitude: number;
      address?: string;
      county?: string;
      state?: string;
      country?: string;
    },
    public readonly leaseId?: string,
    public readonly spudDate?: Date,
    public readonly totalDepth?: number,
    public readonly createdBy?: string,
  ) {}
}
