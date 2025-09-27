import { Test, TestingModule } from '@nestjs/testing';

describe('BullMQConfigService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<BullMQConfigService>(/* BullMQConfigService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
