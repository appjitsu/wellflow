import { Test, TestingModule } from '@nestjs/testing';
import { LeasesModule } from '../leases.module';

describe('LeasesModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [LeasesModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
