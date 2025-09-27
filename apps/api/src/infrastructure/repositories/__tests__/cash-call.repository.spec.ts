import { Test, TestingModule } from '@nestjs/testing';

describe('CashCallRepository', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CashCallRepository>(/* CashCallRepository */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
