import { ICommand } from '@nestjs/cqrs';

export class UpdateTitleOpinionFindingsCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly findings?: string,
    public readonly recommendations?: string,
  ) {}
}
