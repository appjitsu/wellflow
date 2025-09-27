import { Test, TestingModule } from '@nestjs/testing';

describe('compliance-reports', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<compliance-reports>(/* compliance-reports */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

