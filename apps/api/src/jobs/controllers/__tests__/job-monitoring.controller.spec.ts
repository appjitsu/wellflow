import { Test, TestingModule } from '@nestjs/testing';

describe('JobMonitoringController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<JobMonitoringController>(/* JobMonitoringController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
