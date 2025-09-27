import { Test, TestingModule } from '@nestjs/testing';

describe('GetDailyDrillingReportByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDailyDrillingReportByIdHandler>(/* GetDailyDrillingReportByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
