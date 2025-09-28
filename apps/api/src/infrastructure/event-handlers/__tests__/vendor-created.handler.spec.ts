import { Test, TestingModule } from '@nestjs/testing';
import { VendorCreatedHandler } from '../vendor-created.handler';

describe('VendorCreatedHandler', () => {
  let handler: VendorCreatedHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorCreatedHandler],
    }).compile();

    handler = module.get<VendorCreatedHandler>(VendorCreatedHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
