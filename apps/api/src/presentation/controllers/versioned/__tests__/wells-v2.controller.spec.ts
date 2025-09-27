import { Test, TestingModule } from '@nestjs/testing';

describe('WellsV2Controller', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<WellsV2Controller>(/* WellsV2Controller */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
