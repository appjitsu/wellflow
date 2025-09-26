import {
  AuditLog,
  AuditAction,
  AuditResourceType,
  AuditMetadata,
} from './audit-log.entity';

describe('AuditLog', () => {
  describe('AuditAction enum', () => {
    it('should have all required action values', () => {
      expect(AuditAction.CREATE).toBe('CREATE');
      expect(AuditAction.READ).toBe('READ');
      expect(AuditAction.UPDATE).toBe('UPDATE');
      expect(AuditAction.DELETE).toBe('DELETE');
      expect(AuditAction.EXECUTE).toBe('EXECUTE');
      expect(AuditAction.LOGIN).toBe('LOGIN');
      expect(AuditAction.LOGOUT).toBe('LOGOUT');
      expect(AuditAction.EXPORT).toBe('EXPORT');
      expect(AuditAction.IMPORT).toBe('IMPORT');
      expect(AuditAction.APPROVE).toBe('APPROVE');
      expect(AuditAction.REJECT).toBe('REJECT');
      expect(AuditAction.SUBMIT).toBe('SUBMIT');
      expect(AuditAction.CANCEL).toBe('CANCEL');
      expect(AuditAction.RESTORE).toBe('RESTORE');
      expect(AuditAction.ARCHIVE).toBe('ARCHIVE');
    });
  });

  describe('AuditResourceType enum', () => {
    it('should have all required resource type values', () => {
      expect(AuditResourceType.USER).toBe('USER');
      expect(AuditResourceType.ORGANIZATION).toBe('ORGANIZATION');
      expect(AuditResourceType.WELL).toBe('WELL');
      expect(AuditResourceType.LEASE).toBe('LEASE');
      expect(AuditResourceType.PRODUCTION).toBe('PRODUCTION');
      expect(AuditResourceType.PARTNER).toBe('PARTNER');
      expect(AuditResourceType.FINANCIAL).toBe('FINANCIAL');
      expect(AuditResourceType.COMPLIANCE).toBe('COMPLIANCE');
      expect(AuditResourceType.DOCUMENT).toBe('DOCUMENT');
      expect(AuditResourceType.EQUIPMENT).toBe('EQUIPMENT');
      expect(AuditResourceType.DRILLING_PROGRAM).toBe('DRILLING_PROGRAM');
      expect(AuditResourceType.WORKOVER).toBe('WORKOVER');
      expect(AuditResourceType.MAINTENANCE).toBe('MAINTENANCE');
      expect(AuditResourceType.AFE).toBe('AFE');
      expect(AuditResourceType.DIVISION_ORDER).toBe('DIVISION_ORDER');
      expect(AuditResourceType.JOA).toBe('JOA');
      expect(AuditResourceType.REVENUE_DISTRIBUTION).toBe(
        'REVENUE_DISTRIBUTION',
      );
      expect(AuditResourceType.VENDOR).toBe('VENDOR');
      expect(AuditResourceType.SYSTEM).toBe('SYSTEM');
      expect(AuditResourceType.API).toBe('API');
      expect(AuditResourceType.EXTERNAL_SERVICE).toBe('EXTERNAL_SERVICE');
    });
  });

  describe('create factory method', () => {
    it('should create audit log with minimal required parameters', () => {
      const auditLog = AuditLog.create({
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.WELL,
      });

      expect(auditLog.getAction()).toBe(AuditAction.CREATE);
      expect(auditLog.getResourceType()).toBe(AuditResourceType.WELL);
      expect(auditLog.getUserId()).toBeNull();
      expect(auditLog.getOrganizationId()).toBeNull();
      expect(auditLog.getResourceId()).toBeNull();
      expect(auditLog.getSuccess()).toBe(true);
      expect(auditLog.getTimestamp()).toBeInstanceOf(Date);
      expect(auditLog.getId()).toBeDefined();
    });

    it('should create audit log with all optional parameters', () => {
      const metadata: AuditMetadata = {
        sessionId: 'session-123',
        ipAddress: '203.0.113.10',
        endpoint: '/api/wells',
        method: 'POST',
        statusCode: 201,
        duration: 150,
      };

      const auditLog = AuditLog.create({
        userId: 'user-123',
        organizationId: 'org-456',
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.WELL,
        resourceId: 'well-789',
        ipAddress: '203.0.113.10',
        userAgent: 'Mozilla/5.0...',
        oldValues: { name: 'Old Name' },
        newValues: { name: 'New Name' },
        success: true,
        metadata,
        requestId: 'req-123',
        endpoint: '/api/wells/well-789',
        method: 'PUT',
        duration: 150,
      });

      expect(auditLog.getUserId()).toBe('user-123');
      expect(auditLog.getOrganizationId()).toBe('org-456');
      expect(auditLog.getAction()).toBe(AuditAction.UPDATE);
      expect(auditLog.getResourceType()).toBe(AuditResourceType.WELL);
      expect(auditLog.getResourceId()).toBe('well-789');
      expect(auditLog.getIpAddress()).toBe('203.0.113.10');
      expect(auditLog.getUserAgent()).toBe('Mozilla/5.0...');
      expect(auditLog.getOldValues()).toEqual({ name: 'Old Name' });
      expect(auditLog.getNewValues()).toEqual({ name: 'New Name' });
      expect(auditLog.getSuccess()).toBe(true);
      expect(auditLog.getErrorMessage()).toBeNull();
      expect(auditLog.getMetadata()).toBe(metadata);
      expect(auditLog.getRequestId()).toBe('req-123');
      expect(auditLog.getEndpoint()).toBe('/api/wells/well-789');
      expect(auditLog.getMethod()).toBe('PUT');
      expect(auditLog.getDuration()).toBe(150);
    });

    it('should default success to true when not specified', () => {
      const auditLog = AuditLog.create({
        action: AuditAction.READ,
        resourceType: AuditResourceType.DOCUMENT,
      });

      expect(auditLog.getSuccess()).toBe(true);
    });

    it('should allow success to be explicitly set to false', () => {
      const auditLog = AuditLog.create({
        action: AuditAction.DELETE,
        resourceType: AuditResourceType.USER,
        success: false,
        errorMessage: 'Permission denied',
      });

      expect(auditLog.getSuccess()).toBe(false);
      expect(auditLog.getErrorMessage()).toBe('Permission denied');
    });
  });

  describe('business logic methods', () => {
    it('should correctly identify successful operations', () => {
      const successLog = AuditLog.create({
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.WELL,
        success: true,
      });

      const failureLog = AuditLog.create({
        action: AuditAction.DELETE,
        resourceType: AuditResourceType.USER,
        success: false,
      });

      expect(successLog.isSuccessful()).toBe(true);
      expect(failureLog.isSuccessful()).toBe(false);
    });

    it('should correctly identify user context', () => {
      const withUser = AuditLog.create({
        userId: 'user-123',
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.WELL,
      });

      const withoutUser = AuditLog.create({
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.SYSTEM,
      });

      expect(withUser.hasUserContext()).toBe(true);
      expect(withoutUser.hasUserContext()).toBe(false);
    });

    it('should correctly identify organization context', () => {
      const withOrg = AuditLog.create({
        organizationId: 'org-456',
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.AFE,
      });

      const withoutOrg = AuditLog.create({
        action: AuditAction.EXPORT,
        resourceType: AuditResourceType.DOCUMENT,
      });

      expect(withOrg.hasOrganizationContext()).toBe(true);
      expect(withoutOrg.hasOrganizationContext()).toBe(false);
    });

    it('should correctly identify resource context', () => {
      const withResource = AuditLog.create({
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.WELL,
        resourceId: 'well-789',
      });

      const withoutResource = AuditLog.create({
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.SYSTEM,
      });

      expect(withResource.hasResourceContext()).toBe(true);
      expect(withoutResource.hasResourceContext()).toBe(false);
    });

    it('should generate correct resource key', () => {
      const withResource = AuditLog.create({
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.WELL,
        resourceId: 'well-789',
      });

      const withoutResource = AuditLog.create({
        action: AuditAction.EXPORT,
        resourceType: AuditResourceType.DOCUMENT,
      });

      expect(withResource.getResourceKey()).toBe('WELL:well-789');
      expect(withoutResource.getResourceKey()).toBe('DOCUMENT:global');
    });

    it('should generate correct action description', () => {
      const withResource = AuditLog.create({
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.WELL,
        resourceId: 'well-789',
      });

      const withoutResource = AuditLog.create({
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.SYSTEM,
      });

      expect(withResource.getActionDescription()).toBe('UPDATE WELL(well-789)');
      expect(withoutResource.getActionDescription()).toBe('LOGIN SYSTEM');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const metadata: AuditMetadata = {
        sessionId: 'session-123',
        ipAddress: '203.0.113.10',
        endpoint: '/api/wells',
        method: 'POST',
        statusCode: 201,
        duration: 150,
      };

      // Create a mock audit log with controlled timestamp
      const auditLog = new (class extends AuditLog {
        constructor() {
          super(
            'test-id',
            'user-123',
            'org-456',
            AuditAction.CREATE,
            AuditResourceType.WELL,
            'well-789',
            timestamp,
            '203.0.113.10',
            'Mozilla/5.0...',
            { oldName: 'Old' },
            { newName: 'New' },
            true,
            null,
            metadata,
            'req-123',
            '/api/wells',
            'POST',
            150,
          );
        }
      })();

      const json = auditLog.toJSON();

      expect(json).toEqual({
        id: 'test-id',
        userId: 'user-123',
        organizationId: 'org-456',
        action: 'CREATE',
        resourceType: 'WELL',
        resourceId: 'well-789',
        timestamp: '2024-01-01T12:00:00.000Z',
        ipAddress: '203.0.113.10',
        userAgent: 'Mozilla/5.0...',
        oldValues: { oldName: 'Old' },
        newValues: { newName: 'New' },
        success: true,
        errorMessage: null,
        metadata,
        requestId: 'req-123',
        endpoint: '/api/wells',
        method: 'POST',
        duration: 150,
      });
    });
  });

  describe('audit metadata interface', () => {
    it('should support all metadata fields', () => {
      const comprehensiveMetadata: AuditMetadata = {
        eventId: 'event-123',
        eventType: 'WELL_STATUS_CHANGED',
        handler: 'WellStatusChangedHandler',
        error: 'Validation failed',
        sessionId: 'session-456',
        correlationId: 'corr-789',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '203.0.113.100',
        geolocation: {
          country: 'US',
          region: 'TX',
          city: 'Houston',
        },
        deviceInfo: {
          type: 'desktop',
          os: 'Windows',
          browser: 'Chrome',
        },
        businessContext: {
          wellId: 'well-123',
          operatorId: 'op-456',
          leaseId: 'lease-789',
        },
        technicalContext: {
          databaseLatency: 45,
          cacheHit: true,
          externalApiCalls: 2,
        },
        endpoint: '/api/wells/well-123/status',
        method: 'PATCH',
        statusCode: 200,
        duration: 125,
        responseSize: 2048,
        serviceName: 'well-service',
        reportId: 'report-123',
        wellId: 'well-456',
        externalSubmissionId: 'ext-789',
        reportType: 'PRODUCTION_MONTHLY',
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        recordCount: 150,
        rejectionReason: 'Invalid data format',
        errorType: 'VALIDATION_ERROR',
        errorCode: 'VAL_001',
        validationErrors: [
          { field: 'volume', message: 'Must be positive number' },
        ],
        warnings: [{ field: 'date', message: 'Date is in future' }],
        violations: [{ rule: 'data-completeness', severity: 'high' }],
      };

      const auditLog = AuditLog.create({
        action: AuditAction.SUBMIT,
        resourceType: AuditResourceType.COMPLIANCE,
        metadata: comprehensiveMetadata,
      });

      expect(auditLog.getMetadata()).toEqual(comprehensiveMetadata);
    });
  });

  describe('different audit scenarios', () => {
    it('should handle user authentication events', () => {
      const loginLog = AuditLog.create({
        userId: 'user-123',
        action: AuditAction.LOGIN,
        resourceType: AuditResourceType.SYSTEM,
        ipAddress: '203.0.113.10',
        userAgent: 'Chrome/91.0',
        metadata: {
          sessionId: 'session-456',
          geolocation: { country: 'US', city: 'Houston' },
        },
      });

      expect(loginLog.getAction()).toBe(AuditAction.LOGIN);
      expect(loginLog.getResourceType()).toBe(AuditResourceType.SYSTEM);
      expect(loginLog.hasUserContext()).toBe(true);
      expect(loginLog.getActionDescription()).toBe('LOGIN SYSTEM');
    });

    it('should handle data export operations', () => {
      const exportLog = AuditLog.create({
        userId: 'user-123',
        organizationId: 'org-456',
        action: AuditAction.EXPORT,
        resourceType: AuditResourceType.PRODUCTION,
        metadata: {
          recordCount: 1000,
          endpoint: '/api/production/export',
          method: 'GET',
          duration: 2500,
          responseSize: 5242880, // 5MB
        },
      });

      expect(exportLog.getAction()).toBe(AuditAction.EXPORT);
      expect(exportLog.getResourceType()).toBe(AuditResourceType.PRODUCTION);
      expect(exportLog.hasUserContext()).toBe(true);
      expect(exportLog.hasOrganizationContext()).toBe(true);
      expect(exportLog.getActionDescription()).toBe('EXPORT PRODUCTION');
    });

    it('should handle regulatory compliance submissions', () => {
      const submissionLog = AuditLog.create({
        userId: 'user-123',
        organizationId: 'org-456',
        action: AuditAction.SUBMIT,
        resourceType: AuditResourceType.COMPLIANCE,
        resourceId: 'report-789',
        metadata: {
          reportId: 'report-789',
          reportType: 'PRODUCTION_MONTHLY',
          periodStart: '2024-01-01',
          periodEnd: '2024-01-31',
          externalSubmissionId: 'ext-sub-123',
          endpoint: '/api/compliance/submit',
          method: 'POST',
          statusCode: 202,
          duration: 1500,
        },
      });

      expect(submissionLog.getAction()).toBe(AuditAction.SUBMIT);
      expect(submissionLog.getResourceType()).toBe(
        AuditResourceType.COMPLIANCE,
      );
      expect(submissionLog.getResourceId()).toBe('report-789');
      expect(submissionLog.hasResourceContext()).toBe(true);
      expect(submissionLog.getResourceKey()).toBe('COMPLIANCE:report-789');
      expect(submissionLog.getActionDescription()).toBe(
        'SUBMIT COMPLIANCE(report-789)',
      );
    });

    it('should handle API access patterns', () => {
      const apiLog = AuditLog.create({
        userId: 'user-123',
        action: AuditAction.READ,
        resourceType: AuditResourceType.API,
        metadata: {
          endpoint: '/api/wells',
          method: 'GET',
          statusCode: 200,
          duration: 45,
          responseSize: 15360,
          serviceName: 'well-service',
        },
      });

      expect(apiLog.getAction()).toBe(AuditAction.READ);
      expect(apiLog.getResourceType()).toBe(AuditResourceType.API);
      expect(apiLog.getActionDescription()).toBe('READ API');
    });

    it('should handle error scenarios', () => {
      const errorLog = AuditLog.create({
        userId: 'user-123',
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.WELL,
        resourceId: 'well-789',
        success: false,
        errorMessage: 'Permission denied: insufficient privileges',
        metadata: {
          endpoint: '/api/wells/well-789',
          method: 'PUT',
          statusCode: 403,
          duration: 120,
          errorType: 'AUTHORIZATION_ERROR',
          errorCode: 'AUTH_001',
          violations: [{ rule: 'user-role-check', severity: 'high' }],
        },
      });

      expect(errorLog.getSuccess()).toBe(false);
      expect(errorLog.isSuccessful()).toBe(false);
      expect(errorLog.getErrorMessage()).toBe(
        'Permission denied: insufficient privileges',
      );
      expect(errorLog.getActionDescription()).toBe('UPDATE WELL(well-789)');
    });
  });
});
