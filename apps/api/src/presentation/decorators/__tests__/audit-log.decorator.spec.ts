import { Reflector } from '@nestjs/core';
import { AuditLog, AuditLogOptions } from '../audit-log.decorator';

describe('AuditLog Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('basic functionality', () => {
    it('should set metadata with action only', () => {
      const options: AuditLogOptions = {
        action: 'CREATE_WELL',
      };

      @AuditLog(options)
      class TestController {
        testMethod() {}
      }

      const metadata = reflector.get('auditLog', TestController);
      expect(metadata).toEqual(options);
      expect(metadata.action).toBe('CREATE_WELL');
      expect(metadata.resource).toBeUndefined();
      expect(metadata.description).toBeUndefined();
    });

    it('should set metadata with all options', () => {
      const options: AuditLogOptions = {
        action: 'UPDATE_WELL_STATUS',
        resource: 'well',
        description: 'Update well status for compliance tracking',
      };

      @AuditLog(options)
      class TestController {
        testMethod() {}
      }

      const metadata = reflector.get('auditLog', TestController);
      expect(metadata).toEqual(options);
      expect(metadata.action).toBe('UPDATE_WELL_STATUS');
      expect(metadata.resource).toBe('well');
      expect(metadata.description).toBe(
        'Update well status for compliance tracking',
      );
    });

    it('should set metadata with action and resource only', () => {
      const options: AuditLogOptions = {
        action: 'DELETE_WELL',
        resource: 'well',
      };

      @AuditLog(options)
      class TestController {
        testMethod() {}
      }

      const metadata = reflector.get('auditLog', TestController);
      expect(metadata).toEqual(options);
      expect(metadata.action).toBe('DELETE_WELL');
      expect(metadata.resource).toBe('well');
      expect(metadata.description).toBeUndefined();
    });
  });

  describe('method-level decoration', () => {
    it('should set metadata on method', () => {
      const options: AuditLogOptions = {
        action: 'VIEW_WELL',
        resource: 'well',
        description: 'View well details',
      };

      class TestController {
        @AuditLog(options)
        getWell() {}
      }

      const metadata = reflector.get(
        'auditLog',
        TestController.prototype.getWell,
      );
      expect(metadata).toEqual(options);
    });

    it('should allow different audit options on different methods', () => {
      const createOptions: AuditLogOptions = {
        action: 'CREATE_WELL',
        resource: 'well',
      };

      const updateOptions: AuditLogOptions = {
        action: 'UPDATE_WELL',
        resource: 'well',
        description: 'Update well information',
      };

      class TestController {
        @AuditLog(createOptions)
        createWell() {}

        @AuditLog(updateOptions)
        updateWell() {}
      }

      const createMetadata = reflector.get(
        'auditLog',
        TestController.prototype.createWell,
      );
      const updateMetadata = reflector.get(
        'auditLog',
        TestController.prototype.updateWell,
      );

      expect(createMetadata).toEqual(createOptions);
      expect(updateMetadata).toEqual(updateOptions);
      expect(createMetadata).not.toEqual(updateMetadata);
    });
  });

  describe('compliance actions', () => {
    it('should support regulatory compliance actions', () => {
      const regulatoryOptions: AuditLogOptions = {
        action: 'REGULATORY_REPORT',
        resource: 'well',
        description: 'Generate regulatory compliance report',
      };

      @AuditLog(regulatoryOptions)
      class ComplianceController {
        generateReport() {}
      }

      const metadata = reflector.get('auditLog', ComplianceController);
      expect(metadata.action).toBe('REGULATORY_REPORT');
      expect(metadata.description).toContain('regulatory compliance');
    });

    it('should support environmental compliance actions', () => {
      const envOptions: AuditLogOptions = {
        action: 'ENVIRONMENTAL_INSPECTION',
        resource: 'well',
        description: 'Record environmental inspection results',
      };

      class TestController {
        @AuditLog(envOptions)
        recordInspection() {}
      }

      const metadata = reflector.get(
        'auditLog',
        TestController.prototype.recordInspection,
      );
      expect(metadata.action).toBe('ENVIRONMENTAL_INSPECTION');
      expect(metadata.description).toContain('environmental inspection');
    });
  });

  describe('oil and gas specific actions', () => {
    it('should support production data actions', () => {
      const productionOptions: AuditLogOptions = {
        action: 'RECORD_PRODUCTION',
        resource: 'production_data',
        description: 'Record daily production volumes',
      };

      class TestController {
        @AuditLog(productionOptions)
        recordProduction() {}
      }

      const metadata = reflector.get(
        'auditLog',
        TestController.prototype.recordProduction,
      );
      expect(metadata.action).toBe('RECORD_PRODUCTION');
      expect(metadata.resource).toBe('production_data');
    });

    it('should support permit management actions', () => {
      const permitOptions: AuditLogOptions = {
        action: 'ISSUE_PERMIT',
        resource: 'permit',
        description: 'Issue drilling permit',
      };

      class TestController {
        @AuditLog(permitOptions)
        issuePermit() {}
      }

      const metadata = reflector.get(
        'auditLog',
        TestController.prototype.issuePermit,
      );
      expect(metadata.action).toBe('ISSUE_PERMIT');
      expect(metadata.resource).toBe('permit');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const options: AuditLogOptions = {
        action: '',
        resource: '',
        description: '',
      };

      @AuditLog(options)
      class TestController {}

      const metadata = reflector.get('auditLog', TestController);
      expect(metadata.action).toBe('');
      expect(metadata.resource).toBe('');
      expect(metadata.description).toBe('');
    });

    it('should handle special characters in action names', () => {
      const options: AuditLogOptions = {
        action: 'CREATE_WELL_#123',
        resource: 'well-resource',
        description: 'Action with special chars: @#$%',
      };

      @AuditLog(options)
      class TestController {}

      const metadata = reflector.get('auditLog', TestController);
      expect(metadata.action).toBe('CREATE_WELL_#123');
      expect(metadata.resource).toBe('well-resource');
      expect(metadata.description).toBe('Action with special chars: @#$%');
    });
  });

  describe('metadata key consistency', () => {
    it('should use consistent metadata key', () => {
      const options: AuditLogOptions = {
        action: 'TEST_ACTION',
      };

      @AuditLog(options)
      class TestController {}

      // Test that the metadata key is exactly 'auditLog'
      const metadata = reflector.get('auditLog', TestController);
      expect(metadata).toBeDefined();

      // Test that other keys don't return the metadata
      const wrongMetadata = reflector.get('audit_log', TestController);
      expect(wrongMetadata).toBeUndefined();
    });
  });
});
