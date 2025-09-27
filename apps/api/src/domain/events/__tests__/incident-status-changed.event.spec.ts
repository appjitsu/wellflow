import { Test, TestingModule } from '@nestjs/testing';

describe('IncidentStatusChangedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<IncidentStatusChangedEvent>(/* IncidentStatusChangedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
