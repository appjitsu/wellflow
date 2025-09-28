import { Test, TestingModule } from '@nestjs/testing';
import { AuditInterceptor } from '../audit.interceptor';
import { AuditLogService } from '../../../application/services/audit-log.service';

describe('AuditInterceptor', () => {
  let service: AuditInterceptor;

  beforeEach(async () => {
    const mockAuditLogService = {
      logAction: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<AuditInterceptor>(AuditInterceptor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
