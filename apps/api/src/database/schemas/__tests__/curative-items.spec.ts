import { Test, TestingModule } from '@nestjs/testing';

describe('curative-items', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<curative-items>(/* curative-items */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

