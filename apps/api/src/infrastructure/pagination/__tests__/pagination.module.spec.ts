import { Test, TestingModule } from '@nestjs/testing';
import { PaginationModule } from '../pagination.module';

describe('PaginationModule', () => {
  it('should compile the module', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PaginationModule],
    }).compile();

    expect(module).toBeDefined();
  });
});
