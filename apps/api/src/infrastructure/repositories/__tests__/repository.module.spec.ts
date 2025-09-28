import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryModule } from '../repository.module';

describe('RepositoryModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RepositoryModule],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });
});
