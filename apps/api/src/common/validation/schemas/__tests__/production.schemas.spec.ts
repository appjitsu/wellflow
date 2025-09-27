import { Test, TestingModule } from '@nestjs/testing';

describe('production.schemas', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<production.schemas>(/* production.schemas */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
