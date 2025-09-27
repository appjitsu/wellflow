import { Test, TestingModule } from '@nestjs/testing';

describe('IncidentSeverity', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<IncidentSeverity>(/* IncidentSeverity */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
