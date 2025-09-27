import { Test, TestingModule } from '@nestjs/testing';

describe('IncidentSeverityChangedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<IncidentSeverityChangedEvent>(/* IncidentSeverityChangedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
