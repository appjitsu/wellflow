import { Test, TestingModule } from '@nestjs/testing';
import { ValidationModule } from '../validation.module';

describe('ValidationModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ValidationModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
