import { Test, TestingModule } from '@nestjs/testing';

describe('MaintenanceScheduleRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<MaintenanceScheduleRepository>(/* MaintenanceScheduleRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
