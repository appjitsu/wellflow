import { Test, TestingModule } from '@nestjs/testing';

describe('ReportGeneratedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ReportGeneratedEvent>(/* ReportGeneratedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
