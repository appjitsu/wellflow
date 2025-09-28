import { Test, TestingModule } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { AuditLogService } from '../audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../../../domain/entities/audit-log.entity';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let mockAuditLogRepository: any;
  let mockRequest: any;

  beforeEach(async () => {
    mockAuditLogRepository = {
      save: jest.fn(),
      saveBatch: jest.fn(),
    };

    mockRequest = {
      user: {
        id: 'user-123',
        organizationId: 'org-456',
      },
      ip: '192.168.1.1',
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'TestAgent/1.0';
        if (header === 'X-Forwarded-For') return '192.168.1.1';
        return undefined;
      }),
      requestId: 'req-123',
      sessionId: 'sess-456',
      correlationId: 'corr-789',
      route: { path: '/api/test' },
      method: 'POST',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: 'AuditLogRepository',
          useValue: mockAuditLogRepository,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    service = await module.resolve<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('context initialization', () => {
    it('should initialize context from request', () => {
      const context = service.getContext();
      expect(context.userId).toBe('user-123');
      expect(context.organizationId).toBe('org-456');
      expect(context.ipAddress).toBe('192.168.1.1');
      expect(context.userAgent).toBe('TestAgent/1.0');
      expect(context.requestId).toBe('req-123');
      expect(context.sessionId).toBe('sess-456');
      expect(context.correlationId).toBe('corr-789');
    });

    it('should handle missing request', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuditLogService,
          {
            provide: 'AuditLogRepository',
            useValue: mockAuditLogRepository,
          },
          {
            provide: REQUEST,
            useValue: null,
          },
        ],
      }).compile();

      const serviceWithoutRequest =
        await module.resolve<AuditLogService>(AuditLogService);
      const context = serviceWithoutRequest.getContext();
      expect(context.userId).toBeUndefined();
      expect(context.organizationId).toBeUndefined();
    });
  });

  describe('setUserContext', () => {
    it('should set user context manually', () => {
      service.setUserContext('new-user-123', 'new-org-456');
      const context = service.getContext();
      expect(context.userId).toBe('new-user-123');
      expect(context.organizationId).toBe('new-org-456');
    });
  });

  describe('setRequestContext', () => {
    it('should set request context manually', () => {
      service.setRequestContext('new-req-123', 'new-sess-456', 'new-corr-789');
      const context = service.getContext();
      expect(context.requestId).toBe('new-req-123');
      expect(context.sessionId).toBe('new-sess-456');
      expect(context.correlationId).toBe('new-corr-789');
    });
  });

  describe('logSuccess', () => {
    it('should log successful action', async () => {
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      await service.logSuccess(
        AuditAction.CREATE,
        AuditResourceType.WELL,
        'well-123',
        { oldValues: { name: 'Old' }, newValues: { name: 'New' } },
        { eventId: 'event-123' },
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          organizationId: 'org-456',
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-123',
          success: true,
          oldValues: { name: 'Old' },
          newValues: { name: 'New' },
          metadata: expect.objectContaining({
            eventId: 'event-123',
            sessionId: 'sess-456',
            correlationId: 'corr-789',
            endpoint: '/api/test',
            method: 'POST',
          }),
        }),
      );
    });
  });

  describe('logFailure', () => {
    it('should log failed action with error message', async () => {
      mockAuditLogRepository.save.mockResolvedValue(undefined);

      await service.logFailure(
        AuditAction.UPDATE,
        AuditResourceType.WELL,
        'well-123',
        'Validation failed',
        { oldValues: { status: 'ACTIVE' }, newValues: { status: 'INVALID' } },
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-123',
          success: false,
          errorMessage: 'Validation failed',
          oldValues: { status: 'ACTIVE' },
          newValues: { status: 'INVALID' },
        }),
      );
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      mockAuditLogRepository.save.mockResolvedValue(undefined);
    });

    it('should log create action', async () => {
      await service.logCreate(AuditResourceType.WELL, 'well-123', {
        name: 'Test Well',
      });

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-123',
          newValues: { name: 'Test Well' },
        }),
      );
    });

    it('should log read action', async () => {
      await service.logRead(AuditResourceType.WELL, 'well-123');

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.READ,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-123',
        }),
      );
    });

    it('should log update action', async () => {
      await service.logUpdate(
        AuditResourceType.WELL,
        'well-123',
        { status: 'ACTIVE' },
        { status: 'COMPLETED' },
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-123',
          oldValues: { status: 'ACTIVE' },
          newValues: { status: 'COMPLETED' },
        }),
      );
    });

    it('should log delete action', async () => {
      await service.logDelete(AuditResourceType.WELL, 'well-123', {
        name: 'Deleted Well',
      });

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DELETE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-123',
          oldValues: { name: 'Deleted Well' },
        }),
      );
    });

    it('should log login success', async () => {
      await service.logLogin('user-123', true);

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN,
          resourceType: AuditResourceType.USER,
          resourceId: 'user-123',
          success: true,
        }),
      );
    });

    it('should log login failure', async () => {
      await service.logLogin('user-123', false, 'Invalid password');

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN,
          resourceType: AuditResourceType.USER,
          resourceId: 'user-123',
          success: false,
          errorMessage: 'Invalid password',
        }),
      );
    });

    it('should log logout', async () => {
      await service.logLogout('user-123');

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGOUT,
          resourceType: AuditResourceType.USER,
          resourceId: 'user-123',
          success: true,
        }),
      );
    });

    it('should log export action', async () => {
      await service.logExport(AuditResourceType.WELL, {
        recordCount: 100,
        fileName: 'wells.csv',
      });

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.EXPORT,
          resourceType: AuditResourceType.WELL,
          metadata: expect.objectContaining({
            recordCount: 100,
            fileName: 'wells.csv',
          }),
        }),
      );
    });

    it('should log import action', async () => {
      await service.logImport(AuditResourceType.WELL, 50);

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.IMPORT,
          resourceType: AuditResourceType.WELL,
          metadata: expect.objectContaining({
            recordCount: 50,
          }),
        }),
      );
    });

    it('should log approve action', async () => {
      await service.logApprove(AuditResourceType.AFE, 'afe-123');

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.APPROVE,
          resourceType: AuditResourceType.AFE,
          resourceId: 'afe-123',
        }),
      );
    });

    it('should log reject action', async () => {
      await service.logReject(
        AuditResourceType.AFE,
        'afe-123',
        'Insufficient budget',
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REJECT,
          resourceType: AuditResourceType.AFE,
          resourceId: 'afe-123',
          metadata: expect.objectContaining({
            rejectionReason: 'Insufficient budget',
          }),
        }),
      );
    });

    it('should log API call success', async () => {
      await service.logApiCall(
        'ERP',
        '/api/invoices',
        'POST',
        true,
        undefined,
        150,
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.EXECUTE,
          resourceType: AuditResourceType.EXTERNAL_SERVICE,
          resourceId: 'ERP:/api/invoices',
          success: true,
          metadata: expect.objectContaining({
            serviceName: 'ERP',
            endpoint: '/api/test', // This gets overridden by request endpoint
            method: 'POST',
            duration: 150,
            sessionId: 'sess-456',
            correlationId: 'corr-789',
          }),
        }),
      );
    });

    it('should log API call failure', async () => {
      await service.logApiCall(
        'ERP',
        '/api/invoices',
        'POST',
        false,
        'Timeout',
        5000,
      );

      expect(mockAuditLogRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.EXECUTE,
          resourceType: AuditResourceType.EXTERNAL_SERVICE,
          resourceId: 'ERP:/api/invoices',
          success: false,
          errorMessage: 'Timeout',
          metadata: expect.objectContaining({
            duration: 5000,
          }),
        }),
      );
    });
  });

  describe('logBatch', () => {
    it('should log multiple entries in batch', async () => {
      mockAuditLogRepository.saveBatch.mockResolvedValue(undefined);

      const entries = [
        {
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-1',
          success: true,
          changes: { newValues: { name: 'Well 1' } },
        },
        {
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-2',
          success: true,
          changes: {
            oldValues: { status: 'ACTIVE' },
            newValues: { status: 'COMPLETED' },
          },
        },
      ];

      await service.logBatch(entries);

      expect(mockAuditLogRepository.saveBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            action: AuditAction.CREATE,
            resourceType: AuditResourceType.WELL,
            resourceId: 'well-1',
            success: true,
            newValues: { name: 'Well 1' },
          }),
          expect.objectContaining({
            action: AuditAction.UPDATE,
            resourceType: AuditResourceType.WELL,
            resourceId: 'well-2',
            success: true,
            oldValues: { status: 'ACTIVE' },
            newValues: { status: 'COMPLETED' },
          }),
        ]),
      );
    });
  });

  describe('error handling', () => {
    it('should not throw when audit log save fails', async () => {
      mockAuditLogRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.logSuccess(
          AuditAction.CREATE,
          AuditResourceType.WELL,
          'well-123',
        ),
      ).resolves.not.toThrow();
    });

    it('should not throw when batch audit log save fails', async () => {
      mockAuditLogRepository.saveBatch.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.logBatch([
          {
            action: AuditAction.CREATE,
            resourceType: AuditResourceType.WELL,
            resourceId: 'well-123',
          },
        ]),
      ).resolves.not.toThrow();
    });
  });
});
