import { Test, TestingModule } from '@nestjs/testing';

describe('specification', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<specification>(/* specification */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
