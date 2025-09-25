import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateMaintenanceScheduleCommand } from '../commands/create-maintenance-schedule.command';
import { MaintenanceSchedule } from '../../domain/entities/maintenance-schedule.entity';
import type { IMaintenanceScheduleRepository } from '../../domain/repositories/maintenance-schedule.repository.interface';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { MaintenanceScheduleCreatedEvent } from '../../domain/events/maintenance-schedule-created.event';

@CommandHandler(CreateMaintenanceScheduleCommand)
export class CreateMaintenanceScheduleHandler
  implements ICommandHandler<CreateMaintenanceScheduleCommand>
{
  constructor(
    @Inject('MaintenanceScheduleRepository')
    private readonly repo: IMaintenanceScheduleRepository,
    private readonly outbox: OutboxService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateMaintenanceScheduleCommand) {
    const dto = command.dto;
    const entity = new MaintenanceSchedule({
      id: dto.id,
      organizationId: dto.organizationId,
      equipmentId: dto.equipmentId,
      vendorId: dto.vendorId,
      status: dto.status ?? 'scheduled',
    });

    const saved = await this.repo.save(entity);

    this.eventBus.publish(
      new MaintenanceScheduleCreatedEvent(
        saved.getId(),
        saved.getOrganizationId(),
        saved.getEquipmentId(),
        saved.getStatus(),
      ),
    );

    await this.outbox.record({
      eventType: 'MaintenanceScheduleCreatedEvent',
      aggregateType: 'MaintenanceSchedule',
      aggregateId: saved.getId(),
      organizationId: saved.getOrganizationId(),
      payload: {
        id: saved.getId(),
        equipmentId: saved.getEquipmentId(),
        status: saved.getStatus(),
      },
    });

    return { id: saved.getId() };
  }
}
