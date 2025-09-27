import { Test, TestingModule } from '@nestjs/testing';

describe('well.schemas', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<well.schemas>(/* well.schemas */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
