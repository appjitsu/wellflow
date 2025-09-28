import { Test, TestingModule } from '@nestjs/testing';
import { TenantInfrastructureModule } from '../tenant-infrastructure.module';

describe('TenantInfrastructureModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TenantInfrastructureModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
