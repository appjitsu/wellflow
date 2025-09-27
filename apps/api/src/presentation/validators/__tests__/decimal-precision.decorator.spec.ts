import { Test, TestingModule } from '@nestjs/testing';

describe('decimal-precision.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<decimal-precision.decorator>(/* decimal-precision.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

