import { ICommand } from '@nestjs/cqrs';

/**
 * Activate Division Order Command
 * Command to activate a division order
 */
export class ActivateDivisionOrderCommand implements ICommand {
  constructor(
    public readonly divisionOrderId: string,
    public readonly activatedBy: string,
  ) {}
}
