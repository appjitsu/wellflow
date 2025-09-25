import { ICommand } from '@nestjs/cqrs';
import { CurativeStatus } from '../../domain/entities/curative-item.entity';

export class UpdateCurativeItemStatusCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly organizationId: string,
    public readonly status: CurativeStatus,
    public readonly resolutionNotes?: string,
    public readonly updatedBy?: string,
  ) {}
}
