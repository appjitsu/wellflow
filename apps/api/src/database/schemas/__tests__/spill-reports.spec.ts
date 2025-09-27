import { Test, TestingModule } from '@nestjs/testing';

describe('spill-reports', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<spill-reports>(/* spill-reports */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

