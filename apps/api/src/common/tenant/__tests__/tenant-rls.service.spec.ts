import { Test, TestingModule } from '@nestjs/testing';
import { TenantRlsService } from '../tenant-rls.service';
import { TenantContextService } from '../tenant-context.service';
import {
  SetTenantContextUseCase,
  ClearTenantContextUseCase,
  ValidateTenantAccessUseCase,
} from '../../../application/use-cases/set-tenant-context.use-case';

describe('TenantRlsService', () => {
  let service: TenantRlsService;

  const mockSetTenantContextUseCase = {
    execute: jest.fn(),
  };

  const mockClearTenantContextUseCase = {
    execute: jest.fn(),
  };

  const mockValidateTenantAccessUseCase = {
    execute: jest.fn(),
  };

  const mockTenantContextManager = {
    getCurrentTenantContext: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
  };

  const mockTenantIsolationStrategy = {
    getCurrentTenantContext: jest.fn(),
    setTenantContext: jest.fn(),
    clearTenantContext: jest.fn(),
  };

  const mockLegacyTenantContextService = {
    setContext: jest.fn(),
    getContext: jest.fn(),
    runInContext: jest.fn(),
    getOrganizationId: jest.fn(),
    validateOrganizationAccess: jest.fn(),
    createTenantFilter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantRlsService,
        {
          provide: SetTenantContextUseCase,
          useValue: mockSetTenantContextUseCase,
        },
        {
          provide: ClearTenantContextUseCase,
          useValue: mockClearTenantContextUseCase,
        },
        {
          provide: ValidateTenantAccessUseCase,
          useValue: mockValidateTenantAccessUseCase,
        },
        {
          provide: 'ITenantContextManager',
          useValue: mockTenantContextManager,
        },
        {
          provide: 'ITenantIsolationStrategy',
          useValue: mockTenantIsolationStrategy,
        },
        {
          provide: TenantContextService,
          useValue: mockLegacyTenantContextService,
        },
      ],
    }).compile();

    service = module.get<TenantRlsService>(TenantRlsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
