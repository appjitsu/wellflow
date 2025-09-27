import { Test, TestingModule } from '@nestjs/testing';

describe('CreateDailyDrillingReportDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CreateDailyDrillingReportDto>(/* CreateDailyDrillingReportDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
