import { Test, TestingModule } from '@nestjs/testing';

describe('PerformanceTestCommand', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<PerformanceTestCommand>(/* PerformanceTestCommand */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
