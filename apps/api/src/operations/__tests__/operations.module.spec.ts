import { Test, TestingModule } from '@nestjs/testing';
import { OperationsModule } from '../operations.module';

describe('OperationsModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OperationsModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
