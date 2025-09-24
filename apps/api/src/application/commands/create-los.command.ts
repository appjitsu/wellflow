import { ICommand } from '@nestjs/cqrs';

/**
 * Create Lease Operating Statement Command
 * Command to create a new LOS for a specific lease and month
 */
export class CreateLosCommand implements ICommand {
  constructor(
    public readonly organizationId: string,
    public readonly leaseId: string,
    public readonly year: number,
    public readonly month: number,
    public readonly notes?: string,
    public readonly createdBy?: string,
  ) {}
}
