import { Test, TestingModule } from '@nestjs/testing';

describe('CreateMaintenanceScheduleDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CreateMaintenanceScheduleDto>(/* CreateMaintenanceScheduleDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
