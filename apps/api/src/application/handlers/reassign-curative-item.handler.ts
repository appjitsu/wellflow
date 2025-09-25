import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReassignCurativeItemCommand } from '../commands/reassign-curative-item.command';
import type { CurativeItemRepository } from '../../domain/repositories/curative-item.repository.interface';
import type { CurativeActivityRepository } from '../../domain/repositories/curative-activity.repository.interface';
import {
  CurativeActivity,
  ActionType,
} from '../../domain/entities/curative-activity.entity';

@CommandHandler(ReassignCurativeItemCommand)
export class ReassignCurativeItemHandler
  implements ICommandHandler<ReassignCurativeItemCommand>
{
  constructor(
    @Inject('CurativeItemRepository')
    private readonly repo: CurativeItemRepository,
    @Inject('CurativeActivityRepository')
    private readonly activityRepo: CurativeActivityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: ReassignCurativeItemCommand): Promise<void> {
    const item = await this.repo.findById(cmd.id, cmd.organizationId);
    if (!item) {
      throw new NotFoundException('Curative item not found');
    }

    const previousAssignee = item.getAssignedTo();
    item.reassign(cmd.assignedTo, cmd.updatedBy || 'system');
    await this.repo.save(item, cmd.organizationId);

    // Publish domain events
    const events = item.getDomainEvents();
    for (const event of events) {
      this.eventBus.publish(event);
    }
    item.clearDomainEvents();

    // Log activity
    const activity = new CurativeActivity({
      id: randomUUID(),
      curativeItemId: cmd.id,
      actionType: ActionType.ASSIGNED,
      actionBy: cmd.updatedBy,
      details: `Reassigned from ${previousAssignee || 'unassigned'} to ${cmd.assignedTo}`,
    });
    await this.activityRepo.save(activity);
  }
}
