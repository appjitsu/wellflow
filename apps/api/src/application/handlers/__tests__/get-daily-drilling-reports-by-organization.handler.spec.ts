import { Test, TestingModule } from '@nestjs/testing';

describe('GetDailyDrillingReportsByOrganizationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDailyDrillingReportsByOrganizationHandler>(/* GetDailyDrillingReportsByOrganizationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
