import { Test, TestingModule } from '@nestjs/testing';

describe('QueryPerformanceService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<QueryPerformanceService>(/* QueryPerformanceService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
