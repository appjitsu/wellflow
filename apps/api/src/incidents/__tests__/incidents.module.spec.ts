import { Test, TestingModule } from '@nestjs/testing';

describe('IncidentsModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<IncidentsModule>(/* IncidentsModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
