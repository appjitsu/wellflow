import { Test, TestingModule } from '@nestjs/testing';

describe('ReportType', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ReportType>(/* ReportType */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
