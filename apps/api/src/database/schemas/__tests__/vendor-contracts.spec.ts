import { Test, TestingModule } from '@nestjs/testing';

describe('vendor-contracts', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<vendor-contracts>(/* vendor-contracts */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

