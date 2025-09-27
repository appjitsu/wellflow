import { Test, TestingModule } from '@nestjs/testing';

describe('regulatory-filings', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<regulatory-filings>(/* regulatory-filings */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

