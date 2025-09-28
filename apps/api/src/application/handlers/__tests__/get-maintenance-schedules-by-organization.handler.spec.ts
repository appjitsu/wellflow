import { Test, TestingModule } from '@nestjs/testing';
import { GetMaintenanceSchedulesByOrganizationHandler } from '../get-maintenance-schedules-by-organization.handler';

describe('GetMaintenanceSchedulesByOrganizationHandler', () => {
  let handler: GetMaintenanceSchedulesByOrganizationHandler;

  beforeEach(async () => {
    const mockMaintenanceScheduleRepository = {
      findByOrganizationId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMaintenanceSchedulesByOrganizationHandler,
        {
          provide: 'MaintenanceScheduleRepository',
          useValue: mockMaintenanceScheduleRepository,
        },
      ],
    }).compile();

    handler = module.get<GetMaintenanceSchedulesByOrganizationHandler>(
      GetMaintenanceSchedulesByOrganizationHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
