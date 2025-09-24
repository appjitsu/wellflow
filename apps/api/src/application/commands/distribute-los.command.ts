import { ICommand } from '@nestjs/cqrs';

/**
 * Distribute LOS Command
 * Command to distribute a finalized Lease Operating Statement to stakeholders
 */
export class DistributeLosCommand implements ICommand {
  constructor(
    public readonly losId: string,
    public readonly distributedBy: string,
    public readonly distributionMethod: string = 'email',
    public readonly recipientCount: number = 1,
  ) {}
}
