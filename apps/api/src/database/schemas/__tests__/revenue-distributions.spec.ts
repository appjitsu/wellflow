import { Test, TestingModule } from '@nestjs/testing';

describe('revenue-distributions', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<revenue-distributions>(/* revenue-distributions */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

