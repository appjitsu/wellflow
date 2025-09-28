import { Test, TestingModule } from '@nestjs/testing';
import { TestingModule as TestingModuleClass } from '../testing.module';

describe('TestingModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestingModuleClass],
    }).compile();

    expect(module).toBeDefined();
  });
});
