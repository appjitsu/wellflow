import { ICommand } from '@nestjs/cqrs';
import { TitleStatus } from '../../domain/entities/title-opinion.entity';

export class UpdateTitleOpinionStatusCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly status: TitleStatus,
    public readonly updatedBy?: string,
  ) {}
}
