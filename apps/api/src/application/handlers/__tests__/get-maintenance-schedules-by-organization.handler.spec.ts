import { Test, TestingModule } from '@nestjs/testing';
import { GetMaintenanceSchedulesByOrganizationHandler } from '../get-maintenance-schedules-by-organization.handler';
import { IMaintenanceScheduleRepository } from '../../../domain/repositories/maintenance-schedule.repository.interface';

describe('GetMaintenanceSchedulesByOrganizationHandler', () => {
  let handler: GetMaintenanceSchedulesByOrganizationHandler;
  let maintenanceScheduleRepository: IMaintenanceScheduleRepository;

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
    maintenanceScheduleRepository = module.get('MaintenanceScheduleRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
