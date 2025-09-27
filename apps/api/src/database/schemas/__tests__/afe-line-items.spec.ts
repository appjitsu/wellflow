import { Test, TestingModule } from '@nestjs/testing';

describe('afe-line-items', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<afe-line-items>(/* afe-line-items */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

