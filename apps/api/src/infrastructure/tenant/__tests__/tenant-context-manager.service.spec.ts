import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextManagerService } from '../tenant-context-manager.service';
import { TenantIsolationDomainService } from '../../../domain/services/tenant-isolation.domain-service';

describe('TenantContextManagerService', () => {
  let service: TenantContextManagerService;

  beforeEach(async () => {
    const mockTenantIsolationDomainService = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextManagerService,
        {
          provide: TenantIsolationDomainService,
          useValue: mockTenantIsolationDomainService,
        },
      ],
    }).compile();

    service = await module.resolve(TenantContextManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
