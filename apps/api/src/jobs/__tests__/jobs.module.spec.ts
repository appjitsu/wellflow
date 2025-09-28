import { Test, TestingModule } from '@nestjs/testing';
import { JobsModule } from '../jobs.module';

describe('JobsModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JobsModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
