import { Test, TestingModule } from '@nestjs/testing';
import { TitleManagementModule } from '../title-management.module';

describe('TitleManagementModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TitleManagementModule],
    }).compile();
  });

  it('should compile', () => {
    expect(module).toBeDefined();
  });
});
