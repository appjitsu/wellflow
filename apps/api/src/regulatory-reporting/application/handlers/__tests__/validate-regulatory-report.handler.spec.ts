import { Test, TestingModule } from '@nestjs/testing';

describe('ValidateRegulatoryReportHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ValidateRegulatoryReportHandler>(/* ValidateRegulatoryReportHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
