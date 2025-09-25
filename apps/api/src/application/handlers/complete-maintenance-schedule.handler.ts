import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, Inject } from '@nestjs/common';
import { CompleteMaintenanceScheduleCommand } from '../commands/complete-maintenance-schedule.command';
import type { IMaintenanceScheduleRepository } from '../../domain/repositories/maintenance-schedule.repository.interface';
import { MaintenanceSchedule } from '../../domain/entities/maintenance-schedule.entity';
import { OutboxService } from '../../infrastructure/events/outbox.service';
import { MaintenanceScheduleCompletedEvent } from '../../domain/events/maintenance-schedule-completed.event';

@CommandHandler(CompleteMaintenanceScheduleCommand)
export class CompleteMaintenanceScheduleHandler
  implements ICommandHandler<CompleteMaintenanceScheduleCommand>
{
  constructor(
    @Inject('MaintenanceScheduleRepository')
    private readonly repo: IMaintenanceScheduleRepository,
    private readonly outbox: OutboxService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    cmd: CompleteMaintenanceScheduleCommand,
  ): Promise<{ id: string; status: 'completed' }> {
    const existing = await this.repo.findById(cmd.id);
    if (!existing) throw new NotFoundException('MaintenanceSchedule not found');

    // Upsert with status completed
    const updated = new MaintenanceSchedule({
      id: existing.getId(),
      organizationId: existing.getOrganizationId(),
      equipmentId: existing.getEquipmentId(),
      vendorId: existing.getVendorId(),
      status: 'completed',
    });
    await this.repo.save(updated);

    const completedAt = new Date().toISOString();

    // Publish domain event
    this.eventBus.publish(
      new MaintenanceScheduleCompletedEvent(
        updated.getId(),
        updated.getOrganizationId(),
        updated.getEquipmentId(),
        completedAt,
      ),
    );

    // Outbox record
    await this.outbox.record({
      eventType: 'MaintenanceScheduleCompletedEvent',
      aggregateType: 'MaintenanceSchedule',
      aggregateId: updated.getId(),
      organizationId: updated.getOrganizationId(),
      payload: {
        id: updated.getId(),
        equipmentId: updated.getEquipmentId(),
        completedAt,
      },
    });

    return { id: updated.getId(), status: 'completed' };
  }
}
