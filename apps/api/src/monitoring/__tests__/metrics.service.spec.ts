import { Test, TestingModule } from '@nestjs/testing';

describe('MetricsService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<MetricsService>(/* MetricsService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
