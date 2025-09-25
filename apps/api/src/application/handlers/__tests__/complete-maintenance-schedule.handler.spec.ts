import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CompleteMaintenanceScheduleHandler } from '../complete-maintenance-schedule.handler';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { CompleteMaintenanceScheduleCommand } from '../../commands/complete-maintenance-schedule.command';
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

describe('CompleteMaintenanceScheduleHandler', () => {
  it('updates status to completed, publishes event, records outbox', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CompleteMaintenanceScheduleHandler,
        {
          provide: 'MaintenanceScheduleRepository',
          useClass: InMemoryMaintRepo,
        },
        { provide: EventBus, useValue: { publish: jest.fn() } },
        { provide: OutboxService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    const handler = moduleRef.get(CompleteMaintenanceScheduleHandler);

    // seed
    const repo = moduleRef.get<IMaintenanceScheduleRepository>(
      'MaintenanceScheduleRepository',
    ) as InMemoryMaintRepo;
    await repo.save(
      new MaintenanceSchedule({
        id: 'm1',
        organizationId: 'o1',
        equipmentId: 'e1',
        status: 'in_progress',
      }),
    );

    const res = await handler.execute(
      new CompleteMaintenanceScheduleCommand('m1'),
    );
    expect(res).toEqual({ id: 'm1', status: 'completed' });

    const outbox = moduleRef.get<OutboxService>(OutboxService);
    expect(outbox.record).toHaveBeenCalled();
    const bus = moduleRef.get<EventBus>(EventBus);
    expect(bus.publish).toHaveBeenCalled();
  });
});
