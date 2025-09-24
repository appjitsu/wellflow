import { ICommand } from '@nestjs/cqrs';

/**
 * Finalize LOS Command
 * Command to finalize a Lease Operating Statement for distribution
 */
export class FinalizeLosCommand implements ICommand {
  constructor(
    public readonly losId: string,
    public readonly finalizedBy: string,
  ) {}
}
