import { Test, TestingModule } from '@nestjs/testing';

describe('JobMetricsController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<JobMetricsController>(/* JobMetricsController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
