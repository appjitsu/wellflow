import { Test, TestingModule } from '@nestjs/testing';

describe('chain-of-title', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<chain-of-title>(/* chain-of-title */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

