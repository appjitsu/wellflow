import { Test, TestingModule } from '@nestjs/testing';
import { VendorStatusChangedHandler } from '../vendor-status-changed.handler';

describe('VendorStatusChangedHandler', () => {
  let handler: VendorStatusChangedHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorStatusChangedHandler],
    }).compile();

    handler = module.get<VendorStatusChangedHandler>(
      VendorStatusChangedHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
