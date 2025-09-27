import { Test, TestingModule } from '@nestjs/testing';

describe('GetDailyDrillingReportsByOrganizationQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDailyDrillingReportsByOrganizationQuery>(/* GetDailyDrillingReportsByOrganizationQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
