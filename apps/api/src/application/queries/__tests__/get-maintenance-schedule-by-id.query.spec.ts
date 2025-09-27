import { Test, TestingModule } from '@nestjs/testing';

describe('GetMaintenanceScheduleByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetMaintenanceScheduleByIdQuery>(/* GetMaintenanceScheduleByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
