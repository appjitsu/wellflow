import { Test, TestingModule } from '@nestjs/testing';
import { FinancialModule } from '../financial.module';

describe('FinancialModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FinancialModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should compile successfully', () => {
    expect(module.get(FinancialModule)).toBeDefined();
  });
});
