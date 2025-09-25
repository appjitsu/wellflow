import { ICommand } from '@nestjs/cqrs';
import type {
  CurativePriority,
  CurativeStatus,
} from '../../domain/entities/curative-item.entity';

export class CreateCurativeItemCommand implements ICommand {
  constructor(
    public readonly titleOpinionId: string,
    public readonly organizationId: string,
    public readonly itemNumber: string,
    public readonly defectType: string,
    public readonly description: string,
    public readonly priority: CurativePriority,
    public readonly assignedTo?: string,
    public readonly dueDate?: Date,
    public readonly status?: CurativeStatus,
  ) {}
}
