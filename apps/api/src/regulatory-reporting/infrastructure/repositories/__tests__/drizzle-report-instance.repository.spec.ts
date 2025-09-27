import { Test, TestingModule } from '@nestjs/testing';

describe('DrizzleReportInstanceRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<DrizzleReportInstanceRepository>(/* DrizzleReportInstanceRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
