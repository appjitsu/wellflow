import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateCurativeItemCommand } from '../commands/create-curative-item.command';
import type { CurativeItemRepository } from '../../domain/repositories/curative-item.repository.interface';
import { CurativeItem } from '../../domain/entities/curative-item.entity';
import { randomUUID } from 'crypto';

@CommandHandler(CreateCurativeItemCommand)
export class CreateCurativeItemHandler
  implements ICommandHandler<CreateCurativeItemCommand>
{
  constructor(
    @Inject('CurativeItemRepository')
    private readonly repo: CurativeItemRepository,
  ) {}

  async execute(cmd: CreateCurativeItemCommand): Promise<string> {
    const entity = new CurativeItem({
      id: randomUUID(),
      titleOpinionId: cmd.titleOpinionId,
      itemNumber: cmd.itemNumber,
      defectType: cmd.defectType,
      description: cmd.description,
      priority: cmd.priority,
      status: cmd.status,
      assignedTo: cmd.assignedTo,
      dueDate: cmd.dueDate,
    });

    const saved = await this.repo.save(entity, cmd.organizationId);
    return saved.getId();
  }
}
