import { Test, TestingModule } from '@nestjs/testing';

describe('JSONRegulatoryReportFormatStrategy', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<JSONRegulatoryReportFormatStrategy>(/* JSONRegulatoryReportFormatStrategy */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
