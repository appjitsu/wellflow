import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import request from 'supertest';
import { OperationsModule } from '../../../operations/operations.module';
import { DailyDrillingReport } from '../../../domain/entities/daily-drilling-report.entity';
import { DatabaseService } from '../../../database/database.service';
import { OutboxService } from '../../../infrastructure/events/outbox.service';

class FakeDDRRepo {
  save(entity: DailyDrillingReport): Promise<DailyDrillingReport> {
    return Promise.resolve(entity);
  }

  findById(id: string): Promise<DailyDrillingReport> {
    return Promise.resolve(
      new DailyDrillingReport({
        id,
        organizationId: 'o1',
        wellId: 'w1',
        reportDate: new Date('2025-01-01'),
      }),
    );
  }

  findByOrganizationId(): Promise<DailyDrillingReport[]> {
    return Promise.resolve([]);
  }
}

describe('DailyDrillingReportsController (api)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OperationsModule],
    })
      .overrideProvider('DATABASE_CONNECTION')
      .useValue({})
      .overrideProvider(DatabaseService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        getDb: () => ({}),
      })
      .overrideProvider('DailyDrillingReportRepository')
      .useValue(new FakeDDRRepo())
      .overrideProvider('MaintenanceScheduleRepository')
      .useValue({})
      .overrideProvider(EventBus)
      .useValue({
        publish: jest.fn(),
        register: jest.fn(),
        registerSagas: jest.fn(),
        bind: jest.fn(),
      })
      .overrideProvider(OutboxService)
      .useValue({ record: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /daily-drilling-reports/:id/submit should submit DDR', async () => {
    const res = await request(app.getHttpServer())
      .post('/daily-drilling-reports/d1/submit')
      .send({})
      .expect(200);
    expect(res.body).toEqual({ id: 'd1', status: 'submitted' });
  });
});
