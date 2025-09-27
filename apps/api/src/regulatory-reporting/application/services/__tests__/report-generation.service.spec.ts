import { Test, TestingModule } from '@nestjs/testing';

describe('ReportGenerationService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ReportGenerationService>(/* ReportGenerationService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
