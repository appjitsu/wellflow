import { AuditController } from './audit.controller';
import { AuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import {
  AuditAction,
  AuditResourceType,
  AuditLog,
} from '../../domain/entities/audit-log.entity';

describe('AuditController', () => {
  let controller: AuditController;
  let auditLogRepository: jest.Mocked<AuditLogRepository>;

  beforeEach(() => {
    const mockAuditLogRepository = {
      search: jest.fn(),
      findByUserId: jest.fn(),
      findByOrganizationId: jest.fn(),
      findByResource: jest.fn(),
      findById: jest.fn(),
      getStatistics: jest.fn(),
    } as any;

    // Create controller instance directly to avoid guard issues
    controller = new AuditController(mockAuditLogRepository);
    auditLogRepository = mockAuditLogRepository;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchLogs', () => {
    it('should search audit logs with filters', async () => {
      const mockResult = {
        logs: [
          {
            getId: () => ({ getValue: () => 'log-1' }),
            getUserId: () => 'user-1',
            getOrganizationId: () => 'org-1',
            getAction: () => AuditAction.CREATE,
            getResourceType: () => AuditResourceType.WELL,
            getResourceId: () => 'well-1',
            getTimestamp: () => new Date(),
            getIpAddress: () => '127.0.0.1',
            getUserAgent: () => 'test-agent',
            getSuccess: () => true,
            getErrorMessage: () => null,
            getEndpoint: () => '/api/wells',
            getMethod: () => 'POST',
            getDuration: () => 100,
          } as AuditLog,
        ],
        total: 1,
        page: 1,
        limit: 50,
        hasNextPage: false,
        hasPrevPage: false,
      };

      auditLogRepository.search.mockResolvedValue(mockResult);

      const result = await controller.searchLogs(
        'user-1',
        'org-1',
        AuditAction.CREATE,
        AuditResourceType.WELL,
        'well-1',
        true,
        '2024-01-01',
        '2024-01-31',
        1,
        50,
      );

      expect(auditLogRepository.search).toHaveBeenCalledWith(
        {
          userId: 'user-1',
          organizationId: 'org-1',
          action: AuditAction.CREATE,
          resourceType: AuditResourceType.WELL,
          resourceId: 'well-1',
          success: true,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        { page: 1, limit: 50 },
      );
      expect(result.logs).toHaveLength(1);
      expect(result.logs[0]?.id).toBe('log-1');
    });
  });

  describe('getUserLogs', () => {
    it('should get audit logs for a user', async () => {
      const mockResult = {
        logs: [
          {
            getId: () => ({ getValue: () => 'log-1' }),
            getUserId: () => 'user-1',
            getOrganizationId: () => 'org-1',
            getAction: () => AuditAction.READ,
            getResourceType: () => AuditResourceType.WELL,
            getResourceId: () => 'well-1',
            getTimestamp: () => new Date(),
            getIpAddress: () => '127.0.0.1',
            getUserAgent: () => 'test-agent',
            getSuccess: () => true,
            getErrorMessage: () => null,
            getEndpoint: () => '/api/wells',
            getMethod: () => 'GET',
            getDuration: () => 50,
          } as AuditLog,
        ],
        total: 1,
        page: 1,
        limit: 50,
        hasNextPage: false,
        hasPrevPage: false,
      };

      auditLogRepository.findByUserId.mockResolvedValue(mockResult);

      const result = await controller.getUserLogs('user-1', 1, 50);

      expect(auditLogRepository.findByUserId).toHaveBeenCalledWith('user-1', {
        page: 1,
        limit: 50,
      });
      expect(result.logs).toHaveLength(1);
    });
  });

  describe('getAuditLog', () => {
    it('should get a specific audit log', async () => {
      const mockLog = {
        getId: () => ({ getValue: () => 'log-1' }),
        getUserId: () => 'user-1',
        getOrganizationId: () => 'org-1',
        getAction: () => AuditAction.UPDATE,
        getResourceType: () => AuditResourceType.WELL,
        getResourceId: () => 'well-1',
        getTimestamp: () => new Date(),
        getIpAddress: () => '127.0.0.1',
        getUserAgent: () => 'test-agent',
        getSuccess: () => true,
        getErrorMessage: () => null,
        getEndpoint: () => '/api/wells',
        getMethod: () => 'PUT',
        getDuration: () => 75,
        getOldValues: () => ({ status: 'inactive' }),
        getNewValues: () => ({ status: 'active' }),
        getMetadata: () => ({ source: 'api' }),
      } as any;

      auditLogRepository.findById.mockResolvedValue(mockLog);

      const result = await controller.getAuditLog('log-1');

      expect(auditLogRepository.findById).toHaveBeenCalledWith('log-1');
      expect(result.id).toBe('log-1');
      expect(result.oldValues).toEqual({ status: 'inactive' });
      expect(result.newValues).toEqual({ status: 'active' });
    });

    it('should throw error if log not found', async () => {
      auditLogRepository.findById.mockResolvedValue(null);

      await expect(controller.getAuditLog('log-1')).rejects.toThrow(
        'Audit log not found',
      );
    });
  });
});
