import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateMaintenanceScheduleHandler } from '../create-maintenance-schedule.handler';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { CreateMaintenanceScheduleCommand } from '../../commands/create-maintenance-schedule.command';
import type { IMaintenanceScheduleRepository } from '../../../domain/repositories/maintenance-schedule.repository.interface';
import { MaintenanceSchedule } from '../../../domain/entities/maintenance-schedule.entity';

class InMemoryMaintRepo implements IMaintenanceScheduleRepository {
  private store = new Map<string, MaintenanceSchedule>();

  save(entity: MaintenanceSchedule): Promise<MaintenanceSchedule> {
    this.store.set(entity.getId(), entity);
    return Promise.resolve(entity);
  }

  findById(id: string): Promise<MaintenanceSchedule | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByOrganizationId(): Promise<MaintenanceSchedule[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}

describe('CreateMaintenanceScheduleHandler', () => {
  it('saves, publishes event, records outbox', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateMaintenanceScheduleHandler,
        {
          provide: 'MaintenanceScheduleRepository',
          useClass: InMemoryMaintRepo,
        },
        { provide: EventBus, useValue: { publish: jest.fn() } },
        { provide: OutboxService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    const handler = moduleRef.get(CreateMaintenanceScheduleHandler);
    const cmd = new CreateMaintenanceScheduleCommand({
      id: 'm1',
      organizationId: 'o1',
      equipmentId: 'e1',
    });
    const result = await handler.execute(cmd);

    expect(result.id).toBe('m1');
    const outbox = moduleRef.get<OutboxService>(OutboxService);
    expect(outbox.record).toHaveBeenCalled();
    const bus = moduleRef.get<EventBus>(EventBus);
    expect(bus.publish).toHaveBeenCalled();
  });
});
