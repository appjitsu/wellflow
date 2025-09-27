import { Test, TestingModule } from '@nestjs/testing';

describe('normalized-production.dto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<normalized-production.dto>(/* normalized-production.dto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

