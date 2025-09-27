import { Test, TestingModule } from '@nestjs/testing';

describe('ComplianceLimitExceededEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ComplianceLimitExceededEvent>(/* ComplianceLimitExceededEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
