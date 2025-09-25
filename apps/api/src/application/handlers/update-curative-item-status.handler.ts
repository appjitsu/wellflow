import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UpdateCurativeItemStatusCommand } from '../commands/update-curative-item-status.command';
import type { CurativeItemRepository } from '../../domain/repositories/curative-item.repository.interface';
import type { CurativeActivityRepository } from '../../domain/repositories/curative-activity.repository.interface';
import {
  CurativeActivity,
  ActionType,
} from '../../domain/entities/curative-activity.entity';

@CommandHandler(UpdateCurativeItemStatusCommand)
export class UpdateCurativeItemStatusHandler
  implements ICommandHandler<UpdateCurativeItemStatusCommand>
{
  constructor(
    @Inject('CurativeItemRepository')
    private readonly repo: CurativeItemRepository,
    @Inject('CurativeActivityRepository')
    private readonly activityRepo: CurativeActivityRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateCurativeItemStatusCommand): Promise<void> {
    const item = await this.repo.findById(cmd.id, cmd.organizationId);
    if (!item) {
      throw new NotFoundException('Curative item not found');
    }

    // Validate status transition
    const currentStatus = item.getStatus();
    if (currentStatus === cmd.status) {
      throw new BadRequestException('Item is already in this status');
    }

    // Update status (this raises domain event internally)
    item.updateStatus(
      cmd.status,
      cmd.updatedBy || 'system',
      cmd.resolutionNotes,
    );

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
      actionType: ActionType.STATUS_CHANGE,
      actionBy: cmd.updatedBy,
      previousStatus: currentStatus,
      newStatus: cmd.status,
      details: cmd.resolutionNotes,
    });
    await this.activityRepo.save(activity);
  }
}
