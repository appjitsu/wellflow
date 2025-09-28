import { Test, TestingModule } from '@nestjs/testing';
import { SecurityValidationPipe } from '../security-validation.pipe';
import { AuditLogService } from '../../../application/services/audit-log.service';

describe('SecurityValidationPipe', () => {
  let pipe: SecurityValidationPipe;

  beforeEach(async () => {
    const mockAuditLogService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityValidationPipe,
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    pipe = module.get<SecurityValidationPipe>(SecurityValidationPipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });
});
