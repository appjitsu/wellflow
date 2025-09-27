import { Test, TestingModule } from '@nestjs/testing';

describe('IncidentType', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<IncidentType>(/* IncidentType */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
