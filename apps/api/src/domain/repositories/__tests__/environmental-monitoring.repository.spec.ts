import { Test, TestingModule } from '@nestjs/testing';

describe('environmental-monitoring.repository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<environmental-monitoring.repository>(/* environmental-monitoring.repository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

