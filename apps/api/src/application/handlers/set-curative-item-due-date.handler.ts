import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SetCurativeItemDueDateCommand } from '../commands/set-curative-item-due-date.command';
import type { CurativeItemRepository } from '../../domain/repositories/curative-item.repository.interface';
import type { CurativeActivityRepository } from '../../domain/repositories/curative-activity.repository.interface';
import {
  CurativeActivity,
  ActionType,
} from '../../domain/entities/curative-activity.entity';

@CommandHandler(SetCurativeItemDueDateCommand)
export class SetCurativeItemDueDateHandler
  implements ICommandHandler<SetCurativeItemDueDateCommand>
{
  constructor(
    @Inject('CurativeItemRepository')
    private readonly repo: CurativeItemRepository,
    @Inject('CurativeActivityRepository')
    private readonly activityRepo: CurativeActivityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SetCurativeItemDueDateCommand): Promise<void> {
    const item = await this.repo.findById(cmd.id, cmd.organizationId);
    if (!item) {
      throw new NotFoundException('Curative item not found');
    }

    const previousDueDate = item.getDueDate();
    item.setDueDate(cmd.dueDate, cmd.updatedBy || 'system');
    await this.repo.save(item, cmd.organizationId);

    // Publish domain events
    const events = item.getDomainEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
    item.clearDomainEvents();

    // Log activity
    const previousDateStr = previousDueDate
      ? previousDueDate.toISOString().split('T')[0]
      : null;
    const newDateStr = cmd.dueDate
      ? cmd.dueDate.toISOString().split('T')[0]
      : null;
    let details = 'Due date ';
    if (previousDateStr && newDateStr) {
      details += `changed from ${previousDateStr} to ${newDateStr}`;
    } else if (newDateStr) {
      details += `set to ${newDateStr}`;
    } else {
      details += 'removed';
    }
    const activity = new CurativeActivity({
      id: randomUUID(),
      curativeItemId: cmd.id,
      actionType: ActionType.NOTE,
      actionBy: cmd.updatedBy,
      dueDate: cmd.dueDate,
      details,
    });
    await this.activityRepo.save(activity);
  }
}
