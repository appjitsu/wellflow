import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

describe('Roles Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('basic functionality', () => {
    it('should set roles metadata with single role', () => {
      @Roles('admin')
      class TestController {
        testMethod() {}
      }

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual(['admin']);
    });

    it('should set roles metadata with multiple roles', () => {
      @Roles('admin', 'operator', 'viewer')
      class TestController {
        testMethod() {}
      }

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual(['admin', 'operator', 'viewer']);
      expect(metadata).toHaveLength(3);
    });

    it('should set roles metadata on method', () => {
      class TestController {
        @Roles('admin', 'operator')
        restrictedMethod() {}
      }

      const metadata = reflector.get(
        'roles',
        TestController.prototype.restrictedMethod,
      );
      expect(metadata).toEqual(['admin', 'operator']);
    });

    it('should handle empty roles array', () => {
      @Roles()
      class TestController {}

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual([]);
      expect(metadata).toHaveLength(0);
    });
  });

  describe('oil and gas industry roles', () => {
    it('should support standard oil and gas roles', () => {
      @Roles('ADMIN', 'OPERATOR', 'VIEWER', 'REGULATOR', 'AUDITOR')
      class WellController {
        manageWells() {}
      }

      const metadata = reflector.get('roles', WellController);
      expect(metadata).toContain('ADMIN');
      expect(metadata).toContain('OPERATOR');
      expect(metadata).toContain('VIEWER');
      expect(metadata).toContain('REGULATOR');
      expect(metadata).toContain('AUDITOR');
      expect(metadata).toHaveLength(5);
    });

    it('should support operator-specific roles', () => {
      class ProductionController {
        @Roles('OPERATOR', 'PRODUCTION_MANAGER')
        recordProduction() {}

        @Roles('OPERATOR', 'FIELD_SUPERVISOR')
        updateWellStatus() {}
      }

      const productionMetadata = reflector.get(
        'roles',
        ProductionController.prototype.recordProduction,
      );
      const statusMetadata = reflector.get(
        'roles',
        ProductionController.prototype.updateWellStatus,
      );

      expect(productionMetadata).toEqual(['OPERATOR', 'PRODUCTION_MANAGER']);
      expect(statusMetadata).toEqual(['OPERATOR', 'FIELD_SUPERVISOR']);
    });

    it('should support regulatory roles', () => {
      class ComplianceController {
        @Roles('REGULATOR', 'AUDITOR')
        viewComplianceReports() {}

        @Roles('REGULATOR')
        issueViolations() {}

        @Roles('AUDITOR')
        performAudit() {}
      }

      const reportsMetadata = reflector.get(
        'roles',
        ComplianceController.prototype.viewComplianceReports,
      );
      const violationsMetadata = reflector.get(
        'roles',
        ComplianceController.prototype.issueViolations,
      );
      const auditMetadata = reflector.get(
        'roles',
        ComplianceController.prototype.performAudit,
      );

      expect(reportsMetadata).toEqual(['REGULATOR', 'AUDITOR']);
      expect(violationsMetadata).toEqual(['REGULATOR']);
      expect(auditMetadata).toEqual(['AUDITOR']);
    });
  });

  describe('hierarchical role scenarios', () => {
    it('should support admin access to all operations', () => {
      class AdminController {
        @Roles('ADMIN')
        deleteWell() {}

        @Roles('ADMIN', 'OPERATOR')
        updateWell() {}

        @Roles('ADMIN', 'OPERATOR', 'VIEWER')
        viewWell() {}
      }

      const deleteMetadata = reflector.get(
        'roles',
        AdminController.prototype.deleteWell,
      );
      const updateMetadata = reflector.get(
        'roles',
        AdminController.prototype.updateWell,
      );
      const viewMetadata = reflector.get(
        'roles',
        AdminController.prototype.viewWell,
      );

      expect(deleteMetadata).toContain('ADMIN');
      expect(updateMetadata).toContain('ADMIN');
      expect(viewMetadata).toContain('ADMIN');
    });

    it('should support different permission levels', () => {
      class PermissionController {
        @Roles('ADMIN')
        highSecurityOperation() {}

        @Roles('ADMIN', 'OPERATOR')
        mediumSecurityOperation() {}

        @Roles('ADMIN', 'OPERATOR', 'VIEWER')
        lowSecurityOperation() {}

        @Roles('ADMIN', 'OPERATOR', 'VIEWER', 'REGULATOR', 'AUDITOR')
        publicOperation() {}
      }

      const highSec = reflector.get(
        'roles',
        PermissionController.prototype.highSecurityOperation,
      );
      const medSec = reflector.get(
        'roles',
        PermissionController.prototype.mediumSecurityOperation,
      );
      const lowSec = reflector.get(
        'roles',
        PermissionController.prototype.lowSecurityOperation,
      );
      const publicOp = reflector.get(
        'roles',
        PermissionController.prototype.publicOperation,
      );

      expect(highSec).toHaveLength(1);
      expect(medSec).toHaveLength(2);
      expect(lowSec).toHaveLength(3);
      expect(publicOp).toHaveLength(5);
    });
  });

  describe('multiple decorations', () => {
    it('should work on multiple methods in the same class', () => {
      class TestController {
        @Roles('admin')
        adminMethod() {}

        @Roles('operator', 'viewer')
        operatorMethod() {}

        @Roles('viewer')
        viewerMethod() {}
      }

      const adminMetadata = reflector.get(
        'roles',
        TestController.prototype.adminMethod,
      );
      const operatorMetadata = reflector.get(
        'roles',
        TestController.prototype.operatorMethod,
      );
      const viewerMetadata = reflector.get(
        'roles',
        TestController.prototype.viewerMethod,
      );

      expect(adminMetadata).toEqual(['admin']);
      expect(operatorMetadata).toEqual(['operator', 'viewer']);
      expect(viewerMetadata).toEqual(['viewer']);
    });

    it('should not affect methods without the decorator', () => {
      class TestController {
        @Roles('admin')
        restrictedMethod() {}

        publicMethod() {}
      }

      const restrictedMetadata = reflector.get(
        'roles',
        TestController.prototype.restrictedMethod,
      );
      const publicMetadata = reflector.get(
        'roles',
        TestController.prototype.publicMethod,
      );

      expect(restrictedMetadata).toEqual(['admin']);
      expect(publicMetadata).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate roles', () => {
      @Roles('admin', 'admin', 'operator', 'admin')
      class TestController {}

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual(['admin', 'admin', 'operator', 'admin']);
      expect(metadata).toHaveLength(4);
    });

    it('should handle empty string roles', () => {
      @Roles('', 'admin', '')
      class TestController {}

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual(['', 'admin', '']);
      expect(metadata).toHaveLength(3);
    });

    it('should handle special characters in role names', () => {
      @Roles('admin-user', 'operator_level_1', 'viewer@company.com')
      class TestController {}

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toContain('admin-user');
      expect(metadata).toContain('operator_level_1');
      expect(metadata).toContain('viewer@company.com');
    });

    it('should handle numeric role names', () => {
      @Roles('level1', 'level2', 'level3')
      class TestController {}

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual(['level1', 'level2', 'level3']);
    });
  });

  describe('metadata key consistency', () => {
    it('should use consistent metadata key', () => {
      @Roles('admin')
      class TestController {}

      // Test that the metadata key is exactly 'roles'
      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual(['admin']);

      // Test that other keys don't return the metadata
      const wrongMetadata1 = reflector.get('role', TestController);
      const wrongMetadata2 = reflector.get('user_roles', TestController);
      expect(wrongMetadata1).toBeUndefined();
      expect(wrongMetadata2).toBeUndefined();
    });
  });

  describe('decorator function behavior', () => {
    it('should be a function that returns a decorator', () => {
      expect(typeof Roles).toBe('function');

      const decorator = Roles('admin');
      expect(typeof decorator).toBe('function');
    });

    it('should work with spread operator', () => {
      const roleArray = ['admin', 'operator', 'viewer'];

      @Roles(...roleArray)
      class TestController {}

      const metadata = reflector.get('roles', TestController);
      expect(metadata).toEqual(roleArray);
    });

    it('should work with multiple calls', () => {
      const decorator1 = Roles('admin');
      const decorator2 = Roles('operator', 'viewer');

      class TestController1 {
        @decorator1
        method1() {}
      }

      class TestController2 {
        @decorator2
        method2() {}
      }

      const metadata1 = reflector.get(
        'roles',
        TestController1.prototype.method1,
      );
      const metadata2 = reflector.get(
        'roles',
        TestController2.prototype.method2,
      );

      expect(metadata1).toEqual(['admin']);
      expect(metadata2).toEqual(['operator', 'viewer']);
    });
  });

  describe('real-world scenarios', () => {
    it('should support well management permissions', () => {
      class WellManagementController {
        @Roles('ADMIN', 'OPERATOR')
        createWell() {}

        @Roles('ADMIN', 'OPERATOR', 'VIEWER')
        getWell() {}

        @Roles('ADMIN')
        deleteWell() {}

        @Roles('OPERATOR')
        updateWellStatus() {}

        @Roles('REGULATOR', 'AUDITOR')
        auditWell() {}
      }

      const createRoles = reflector.get(
        'roles',
        WellManagementController.prototype.createWell,
      );
      const getRoles = reflector.get(
        'roles',
        WellManagementController.prototype.getWell,
      );
      const deleteRoles = reflector.get(
        'roles',
        WellManagementController.prototype.deleteWell,
      );
      const updateRoles = reflector.get(
        'roles',
        WellManagementController.prototype.updateWellStatus,
      );
      const auditRoles = reflector.get(
        'roles',
        WellManagementController.prototype.auditWell,
      );

      expect(createRoles).toEqual(['ADMIN', 'OPERATOR']);
      expect(getRoles).toEqual(['ADMIN', 'OPERATOR', 'VIEWER']);
      expect(deleteRoles).toEqual(['ADMIN']);
      expect(updateRoles).toEqual(['OPERATOR']);
      expect(auditRoles).toEqual(['REGULATOR', 'AUDITOR']);
    });
  });
});
