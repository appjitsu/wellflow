import { Test, TestingModule } from '@nestjs/testing';

describe('hse-incident.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<hse-incident.repository>(/* hse-incident.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

