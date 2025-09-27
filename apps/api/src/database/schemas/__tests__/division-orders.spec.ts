import { Test, TestingModule } from '@nestjs/testing';

describe('division-orders', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<division-orders>(/* division-orders */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

