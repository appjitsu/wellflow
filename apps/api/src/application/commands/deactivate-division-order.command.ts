import { ICommand } from '@nestjs/cqrs';

/**
 * Deactivate Division Order Command
 * Command to deactivate a division order
 */
export class DeactivateDivisionOrderCommand implements ICommand {
  constructor(
    public readonly divisionOrderId: string,
    public readonly deactivatedBy: string,
    public readonly reason?: string,
  ) {}
}
