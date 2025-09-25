import { ICommand } from '@nestjs/cqrs';

export class ReassignCurativeItemCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly assignedTo: string,
    public readonly updatedBy?: string,
  ) {}
}
