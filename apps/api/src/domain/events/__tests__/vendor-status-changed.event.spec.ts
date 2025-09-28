import { Test, TestingModule } from '@nestjs/testing';
import { VendorStatusChangedEvent } from '../vendor-status-changed.event';

describe('VendorStatusChangedEvent', () => {
  let service: VendorStatusChangedEvent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorStatusChangedEvent],
    }).compile();

    service = module.get<VendorStatusChangedEvent>(VendorStatusChangedEvent);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
