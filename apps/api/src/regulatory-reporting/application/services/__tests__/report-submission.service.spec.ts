import { Test, TestingModule } from '@nestjs/testing';

describe('ReportSubmissionService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ReportSubmissionService>(/* ReportSubmissionService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
