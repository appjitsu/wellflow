import { Test, TestingModule } from '@nestjs/testing';

describe('GenerateRegulatoryReportHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GenerateRegulatoryReportHandler>(/* GenerateRegulatoryReportHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
