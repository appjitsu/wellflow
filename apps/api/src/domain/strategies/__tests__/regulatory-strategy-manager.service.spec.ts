import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryStrategyManagerService } from '../regulatory-strategy-manager.service';

describe('RegulatoryStrategyManagerService', () => {
  let service: RegulatoryStrategyManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegulatoryStrategyManagerService],
    }).compile();

    service = module.get(RegulatoryStrategyManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
