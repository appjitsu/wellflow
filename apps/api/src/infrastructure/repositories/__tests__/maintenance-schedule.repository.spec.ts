import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceScheduleRepository } from '../maintenance-schedule.repository';

describe('MaintenanceScheduleRepository', () => {
  let service: MaintenanceScheduleRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaintenanceScheduleRepository],
    }).compile();

    service = module.get<MaintenanceScheduleRepository>(
      MaintenanceScheduleRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
