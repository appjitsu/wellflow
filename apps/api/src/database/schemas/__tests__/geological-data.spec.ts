import { Test, TestingModule } from '@nestjs/testing';

describe('geological-data', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<geological-data>(/* geological-data */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

