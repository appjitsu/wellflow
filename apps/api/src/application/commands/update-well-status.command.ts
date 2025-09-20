import { ICommand } from '@nestjs/cqrs';
import { WellStatus } from '../../domain/enums/well-status.enum';

/**
 * Update Well Status Command
 * Command to update a well's status
 */
export class UpdateWellStatusCommand implements ICommand {
  constructor(
    public readonly wellId: string,
    public readonly newStatus: WellStatus,
    public readonly updatedBy: string,
    public readonly reason?: string,
  ) {}
}
