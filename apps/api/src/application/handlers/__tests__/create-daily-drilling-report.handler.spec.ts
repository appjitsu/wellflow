import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateDailyDrillingReportHandler } from '../create-daily-drilling-report.handler';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { CreateDailyDrillingReportCommand } from '../../commands/create-daily-drilling-report.command';
import type { IDailyDrillingReportRepository } from '../../../domain/repositories/daily-drilling-report.repository.interface';
import { DailyDrillingReport } from '../../../domain/entities/daily-drilling-report.entity';

class InMemoryDDRRepo implements IDailyDrillingReportRepository {
  private store = new Map<string, DailyDrillingReport>();

  save(entity: DailyDrillingReport): Promise<DailyDrillingReport> {
    this.store.set(entity.getId(), entity);
    return Promise.resolve(entity);
  }

  findById(id: string): Promise<DailyDrillingReport | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByOrganizationId(): Promise<DailyDrillingReport[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }
}

describe('CreateDailyDrillingReportHandler', () => {
  it('saves, publishes event, records outbox', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateDailyDrillingReportHandler,
        { provide: 'DailyDrillingReportRepository', useClass: InMemoryDDRRepo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
        { provide: OutboxService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    const handler = moduleRef.get(CreateDailyDrillingReportHandler);
    const cmd = new CreateDailyDrillingReportCommand({
      id: 'd1',
      organizationId: 'o1',
      wellId: 'w1',
      reportDate: '2025-01-01',
    });
    const result = await handler.execute(cmd);

    expect(result.id).toBe('d1');
    const outbox = moduleRef.get<OutboxService>(OutboxService);
    expect(outbox.record).toHaveBeenCalled();
    const bus = moduleRef.get<EventBus>(EventBus);
    expect(bus.publish).toHaveBeenCalled();
  });
});
