import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import request from 'supertest';
import { OperationsModule } from '../../../operations/operations.module';
import {
  MaintenanceSchedule,
  type MaintenanceStatus,
} from '../../../domain/entities/maintenance-schedule.entity';
import { DatabaseService } from '../../../database/database.service';
import { OutboxService } from '../../../infrastructure/events/outbox.service';

class FakeMaintRepo {
  save(entity: MaintenanceSchedule): Promise<MaintenanceSchedule> {
    return Promise.resolve(entity);
  }

  findById(id: string): Promise<MaintenanceSchedule> {
    const status: MaintenanceStatus = 'in_progress';
    return Promise.resolve(
      new MaintenanceSchedule({
        id,
        organizationId: 'o1',
        equipmentId: 'e1',
        status,
      }),
    );
  }

  findByOrganizationId(): Promise<MaintenanceSchedule[]> {
    return Promise.resolve([]);
  }
}

describe('MaintenanceSchedulesController (api)', () => {
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
      .overrideProvider('MaintenanceScheduleRepository')
      .useValue(new FakeMaintRepo())
      .overrideProvider('DailyDrillingReportRepository')
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

  it('POST /maintenance-schedules/:id/complete should complete schedule', async () => {
    const res = await request(app.getHttpServer())
      .post('/maintenance-schedules/m1/complete')
      .send({})
      .expect(200);
    expect(res.body).toEqual({ id: 'm1', status: 'completed' });
  });
});
