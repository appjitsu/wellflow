import { Test, TestingModule } from '@nestjs/testing';

describe('ReportOverdueEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ReportOverdueEvent>(/* ReportOverdueEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
