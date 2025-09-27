import { Test, TestingModule } from '@nestjs/testing';

describe('FinancialModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<FinancialModule>(/* FinancialModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
