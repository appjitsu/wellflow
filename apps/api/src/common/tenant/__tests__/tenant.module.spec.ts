import { Test, TestingModule } from '@nestjs/testing';
import { TenantModule } from '../tenant.module';
import { TenantContextService } from '../tenant-context.service';

describe('TenantModule', () => {
  let module: TestingModule;
  let tenantContextService: TenantContextService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TenantModule],
    }).compile();

    tenantContextService =
      await module.resolve<TenantContextService>(TenantContextService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide TenantContextService', () => {
    expect(tenantContextService).toBeDefined();
  });
});
