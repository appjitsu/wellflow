import { Test, TestingModule } from '@nestjs/testing';

describe('cash-calls', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<cash-calls>(/* cash-calls */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

