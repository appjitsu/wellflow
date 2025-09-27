import { Test, TestingModule } from '@nestjs/testing';

describe('enhanced-api-docs.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<enhanced-api-docs.decorator>(/* enhanced-api-docs.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

