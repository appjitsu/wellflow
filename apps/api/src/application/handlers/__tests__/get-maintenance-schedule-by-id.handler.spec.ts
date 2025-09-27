import { Test, TestingModule } from '@nestjs/testing';

describe('GetMaintenanceScheduleByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetMaintenanceScheduleByIdHandler>(/* GetMaintenanceScheduleByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
