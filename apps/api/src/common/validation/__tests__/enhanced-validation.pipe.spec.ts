import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedValidationPipe } from '../enhanced-validation.pipe';
import { AuditLogService } from '../../../application/services/audit-log.service';

describe('EnhancedValidationPipe', () => {
  let pipe: EnhancedValidationPipe;

  beforeEach(async () => {
    const mockAuditLogService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedValidationPipe,
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    pipe = module.get<EnhancedValidationPipe>(EnhancedValidationPipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });
});
