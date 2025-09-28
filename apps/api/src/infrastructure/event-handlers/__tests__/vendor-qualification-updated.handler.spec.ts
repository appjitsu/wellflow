import { Test, TestingModule } from '@nestjs/testing';
import { VendorQualificationUpdatedHandler } from '../vendor-qualification-updated.handler';

describe('VendorQualificationUpdatedHandler', () => {
  let service: VendorQualificationUpdatedHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorQualificationUpdatedHandler],
    }).compile();

    service = module.get<VendorQualificationUpdatedHandler>(
      VendorQualificationUpdatedHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
