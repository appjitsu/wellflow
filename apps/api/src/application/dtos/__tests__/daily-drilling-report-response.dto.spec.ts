import { Test, TestingModule } from '@nestjs/testing';

describe('SubmitDailyDrillingReportResponseDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<SubmitDailyDrillingReportResponseDto>(/* SubmitDailyDrillingReportResponseDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
