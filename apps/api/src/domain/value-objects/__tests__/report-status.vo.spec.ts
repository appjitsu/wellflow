import { Test, TestingModule } from '@nestjs/testing';

describe('ReportStatus', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ReportStatus>(/* ReportStatus */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
