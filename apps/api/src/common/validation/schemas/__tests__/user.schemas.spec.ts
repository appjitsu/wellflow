import { Test, TestingModule } from '@nestjs/testing';

describe('user.schemas', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<user.schemas>(/* user.schemas */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
