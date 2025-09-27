import { Test, TestingModule } from '@nestjs/testing';

describe('api-examples.decorator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<api-examples.decorator>(/* api-examples.decorator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

