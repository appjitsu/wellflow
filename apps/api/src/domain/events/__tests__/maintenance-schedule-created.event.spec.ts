import { Test, TestingModule } from '@nestjs/testing';

describe('MaintenanceScheduleCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<MaintenanceScheduleCreatedEvent>(/* MaintenanceScheduleCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
