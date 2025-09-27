import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryReportingController', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryReportingController>(/* RegulatoryReportingController */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
