import { Test, TestingModule } from '@nestjs/testing';

describe('ReportValidationService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ReportValidationService>(/* ReportValidationService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
