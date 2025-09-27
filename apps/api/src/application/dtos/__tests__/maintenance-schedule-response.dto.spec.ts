import { Test, TestingModule } from '@nestjs/testing';

describe('CompleteMaintenanceScheduleResponseDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CompleteMaintenanceScheduleResponseDto>(/* CompleteMaintenanceScheduleResponseDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
