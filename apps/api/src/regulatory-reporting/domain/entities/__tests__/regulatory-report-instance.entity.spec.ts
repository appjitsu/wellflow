import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryReportInstance', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryReportInstance>(/* RegulatoryReportInstance */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
