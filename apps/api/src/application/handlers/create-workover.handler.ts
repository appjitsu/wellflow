import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateWorkoverCommand } from '../commands/create-workover.command';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import type { IWorkoverRepository } from '../../domain/repositories/workover.repository.interface';
import { WorkoverCreatedEvent } from '../../domain/events/workover-created.event';
import { Workover } from '../../domain/entities/workover.entity';

@CommandHandler(CreateWorkoverCommand)
export class CreateWorkoverHandler
  implements ICommandHandler<CreateWorkoverCommand>
{
  constructor(
    @Inject('WorkoverRepository') private readonly repo: IWorkoverRepository,
    private readonly eventBus: EventBus,
    private readonly outbox: OutboxService,
  ) {}

  async execute(command: CreateWorkoverCommand): Promise<string> {
    if (!command.organizationId || !command.wellId) {
      throw new BadRequestException('organizationId and wellId are required');
    }

    const entity = new Workover({
      id: randomUUID(),
      organizationId: command.organizationId,
      wellId: command.wellId,
      afeId: command.options?.afeId,
      reason: command.options?.reason,
      status: command.options?.status,
      startDate: command.options?.startDate
        ? new Date(command.options.startDate)
        : undefined,
      endDate: command.options?.endDate
        ? new Date(command.options.endDate)
        : undefined,
      preProductionSnapshot: command.options?.preProductionSnapshot,
      postProductionSnapshot: command.options?.postProductionSnapshot,
    });

    const saved = await this.repo.save(entity);

    // Publish domain event
    this.eventBus.publish(
      new WorkoverCreatedEvent(
        saved.getId(),
        saved.getOrganizationId(),
        saved.getWellId(),
        saved.getStatus(),
      ),
    );

    // Record to outbox for reliable external publishing
    await this.outbox.record({
      eventType: 'WorkoverCreated',
      aggregateType: 'Workover',
      aggregateId: saved.getId(),
      organizationId: saved.getOrganizationId(),
      payload: {
        id: saved.getId(),
        organizationId: saved.getOrganizationId(),
        wellId: saved.getWellId(),
        status: saved.getStatus(),
      },
    });

    return saved.getId();
  }
}
