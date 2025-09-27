import { Test, TestingModule } from '@nestjs/testing';

describe('NormalizedProductionService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<NormalizedProductionService>(/* NormalizedProductionService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
