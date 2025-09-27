import { Test, TestingModule } from '@nestjs/testing';

describe('environmental-monitoring', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<environmental-monitoring>(/* environmental-monitoring */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

