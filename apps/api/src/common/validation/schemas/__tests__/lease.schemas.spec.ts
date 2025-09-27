import { Test, TestingModule } from '@nestjs/testing';

describe('lease.schemas', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<lease.schemas>(/* lease.schemas */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
