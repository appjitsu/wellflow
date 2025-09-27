import { Test, TestingModule } from '@nestjs/testing';

describe('regulatory-reports', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<regulatory-reports>(/* regulatory-reports */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

