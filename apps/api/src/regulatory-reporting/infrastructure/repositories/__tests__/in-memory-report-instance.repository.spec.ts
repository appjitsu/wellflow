import { Test, TestingModule } from '@nestjs/testing';

describe('InMemoryReportInstanceRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<InMemoryReportInstanceRepository>(/* InMemoryReportInstanceRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
