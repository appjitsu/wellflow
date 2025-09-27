import { Test, TestingModule } from '@nestjs/testing';

describe('GenerateRegulatoryReportCommand', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GenerateRegulatoryReportCommand>(/* GenerateRegulatoryReportCommand */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
