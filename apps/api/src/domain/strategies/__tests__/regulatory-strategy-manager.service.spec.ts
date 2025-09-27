import { Test, TestingModule } from '@nestjs/testing';

describe('RegulatoryStrategyManagerService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RegulatoryStrategyManagerService>(/* RegulatoryStrategyManagerService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
