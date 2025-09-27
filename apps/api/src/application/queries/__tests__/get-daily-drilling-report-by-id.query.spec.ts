import { Test, TestingModule } from '@nestjs/testing';

describe('GetDailyDrillingReportByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDailyDrillingReportByIdQuery>(/* GetDailyDrillingReportByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
