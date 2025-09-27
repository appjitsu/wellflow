import { Test, TestingModule } from '@nestjs/testing';

describe('IncidentReportedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<IncidentReportedEvent>(/* IncidentReportedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
