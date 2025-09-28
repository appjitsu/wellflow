import { Test, TestingModule } from '@nestjs/testing';
import { SetTenantContextUseCase } from '../set-tenant-context.use-case';
import { TenantIsolationDomainService } from '../../../domain/services/tenant-isolation.domain-service';

describe('SetTenantContextUseCase', () => {
  let service: SetTenantContextUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetTenantContextUseCase,
        {
          provide: TenantIsolationDomainService,
          useValue: {
            validateTenantAccess: jest.fn(),
          },
        },
        {
          provide: 'ITenantIsolationStrategy',
          useValue: {
            setTenantContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SetTenantContextUseCase>(SetTenantContextUseCase);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
