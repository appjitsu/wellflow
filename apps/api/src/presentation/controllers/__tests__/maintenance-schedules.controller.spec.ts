import { Test, TestingModule } from '@nestjs/testing';

describe('MaintenanceSchedulesController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<MaintenanceSchedulesController>(/* MaintenanceSchedulesController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
