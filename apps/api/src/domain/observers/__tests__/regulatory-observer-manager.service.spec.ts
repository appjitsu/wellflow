import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryObserverManagerService } from '../regulatory-observer-manager.service';

describe('RegulatoryObserverManagerService', () => {
  let service: RegulatoryObserverManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegulatoryObserverManagerService],
    }).compile();

    service = module.get<RegulatoryObserverManagerService>(
      RegulatoryObserverManagerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
