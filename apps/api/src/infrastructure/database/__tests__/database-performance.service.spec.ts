import { Test, TestingModule } from '@nestjs/testing';

describe('DatabasePerformanceService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DatabasePerformanceService>(/* DatabasePerformanceService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
