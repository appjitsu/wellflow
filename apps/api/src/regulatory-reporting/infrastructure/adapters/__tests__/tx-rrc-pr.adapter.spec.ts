import { Test, TestingModule } from '@nestjs/testing';

describe('TxRrcPrAdapter', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<TxRrcPrAdapter>(/* TxRrcPrAdapter */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
