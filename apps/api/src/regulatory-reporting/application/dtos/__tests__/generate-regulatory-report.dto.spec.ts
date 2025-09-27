import { Test, TestingModule } from '@nestjs/testing';

describe('GenerateRegulatoryReportRequestDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GenerateRegulatoryReportRequestDto>(/* GenerateRegulatoryReportRequestDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
