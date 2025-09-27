import { Test, TestingModule } from '@nestjs/testing';

describe('aggregate-root', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<aggregate-root>(/* aggregate-root */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

