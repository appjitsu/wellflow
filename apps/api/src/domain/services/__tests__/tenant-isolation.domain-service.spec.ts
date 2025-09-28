import { Test, TestingModule } from '@nestjs/testing';
import { TenantIsolationDomainService } from '../tenant-isolation.domain-service';

describe('TenantIsolationDomainService', () => {
  let service: TenantIsolationDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantIsolationDomainService],
    }).compile();

    service = module.get<TenantIsolationDomainService>(
      TenantIsolationDomainService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
