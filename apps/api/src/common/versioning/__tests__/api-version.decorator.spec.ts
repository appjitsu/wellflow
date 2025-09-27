import { Test, TestingModule } from '@nestjs/testing';

describe('api-version.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<api-version.decorator>(/* api-version.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

