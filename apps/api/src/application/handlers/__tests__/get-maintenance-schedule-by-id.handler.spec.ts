import { Test, TestingModule } from '@nestjs/testing';
import { GetMaintenanceScheduleByIdHandler } from '../get-maintenance-schedule-by-id.handler';

describe('GetMaintenanceScheduleByIdHandler', () => {
  let handler: GetMaintenanceScheduleByIdHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMaintenanceScheduleByIdHandler,
        {
          provide: 'MaintenanceScheduleRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<GetMaintenanceScheduleByIdHandler>(
      GetMaintenanceScheduleByIdHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
