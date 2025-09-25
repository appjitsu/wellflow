import { ICommand } from '@nestjs/cqrs';

export class SetCurativeItemDueDateCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly dueDate?: Date,
    public readonly updatedBy?: string,
  ) {}
}
