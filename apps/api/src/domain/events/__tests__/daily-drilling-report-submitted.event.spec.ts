import { Test, TestingModule } from '@nestjs/testing';

describe('DailyDrillingReportSubmittedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DailyDrillingReportSubmittedEvent>(/* DailyDrillingReportSubmittedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
