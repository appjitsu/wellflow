import { Test, TestingModule } from '@nestjs/testing';

describe('TRCRegulatoryACL', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<TRCRegulatoryACL>(/* TRCRegulatoryACL */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
