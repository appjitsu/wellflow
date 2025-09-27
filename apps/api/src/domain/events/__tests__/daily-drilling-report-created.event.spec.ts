import { Test, TestingModule } from '@nestjs/testing';

describe('DailyDrillingReportCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DailyDrillingReportCreatedEvent>(/* DailyDrillingReportCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
