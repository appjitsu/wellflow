import { Test, TestingModule } from '@nestjs/testing';

describe('revenue-distribution.repository.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<revenue-distribution.repository.interface>(/* revenue-distribution.repository.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

