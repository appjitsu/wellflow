import { Test } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { SubmitDailyDrillingReportHandler } from '../submit-daily-drilling-report.handler';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { SubmitDailyDrillingReportCommand } from '../../commands/submit-daily-drilling-report.command';
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

describe(SubmitDailyDrillingReportHandler.name, () => {
  it('publishes event and records outbox when DDR exists', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SubmitDailyDrillingReportHandler,
        { provide: 'DailyDrillingReportRepository', useClass: InMemoryDDRRepo },
        { provide: EventBus, useValue: { publish: jest.fn() } },
        { provide: OutboxService, useValue: { record: jest.fn() } },
      ],
    }).compile();

    const handler = moduleRef.get(SubmitDailyDrillingReportHandler);

    // seed
    const repo = moduleRef.get<IDailyDrillingReportRepository>(
      'DailyDrillingReportRepository',
    );
    await repo.save(
      new DailyDrillingReport({
        id: 'd1',
        organizationId: 'o1',
        wellId: 'w1',
        reportDate: new Date('2025-01-01'),
      }),
    );

    const res = await handler.execute(
      new SubmitDailyDrillingReportCommand('d1'),
    );
    expect(res).toEqual({ id: 'd1', status: 'submitted' });

    const outbox = moduleRef.get<OutboxService>(OutboxService);
    expect(outbox.record).toHaveBeenCalled();
    const bus = moduleRef.get<EventBus>(EventBus);
    expect(bus.publish).toHaveBeenCalled();
  });
});
