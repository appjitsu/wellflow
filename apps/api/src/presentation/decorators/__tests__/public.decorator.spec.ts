import { Reflector } from '@nestjs/core';
import { Public } from '../public.decorator';

describe('Public Decorator', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('basic functionality', () => {
    it('should set isPublic metadata to true on class', () => {
      @Public()
      class TestController {
        testMethod() {}
      }

      const metadata = reflector.get('isPublic', TestController);
      expect(metadata).toBe(true);
    });

    it('should set isPublic metadata to true on method', () => {
      class TestController {
        @Public()
        publicMethod() {}
      }

      const metadata = reflector.get(
        'isPublic',
        TestController.prototype.publicMethod,
      );
      expect(metadata).toBe(true);
    });

    it('should not affect methods without the decorator', () => {
      class TestController {
        @Public()
        publicMethod() {}

        privateMethod() {}
      }

      const publicMetadata = reflector.get(
        'isPublic',
        TestController.prototype.publicMethod,
      );
      const privateMetadata = reflector.get(
        'isPublic',
        TestController.prototype.privateMethod,
      );

      expect(publicMetadata).toBe(true);
      expect(privateMetadata).toBeUndefined();
    });
  });

  describe('multiple decorations', () => {
    it('should work on multiple methods in the same class', () => {
      class TestController {
        @Public()
        publicMethod1() {}

        @Public()
        publicMethod2() {}

        privateMethod() {}
      }

      const public1Metadata = reflector.get(
        'isPublic',
        TestController.prototype.publicMethod1,
      );
      const public2Metadata = reflector.get(
        'isPublic',
        TestController.prototype.publicMethod2,
      );
      const privateMetadata = reflector.get(
        'isPublic',
        TestController.prototype.privateMethod,
      );

      expect(public1Metadata).toBe(true);
      expect(public2Metadata).toBe(true);
      expect(privateMetadata).toBeUndefined();
    });

    it('should work when applied to both class and method', () => {
      @Public()
      class TestController {
        @Public()
        publicMethod() {}

        normalMethod() {}
      }

      const classMetadata = reflector.get('isPublic', TestController);
      const methodMetadata = reflector.get(
        'isPublic',
        TestController.prototype.publicMethod,
      );
      const normalMethodMetadata = reflector.get(
        'isPublic',
        TestController.prototype.normalMethod,
      );

      expect(classMetadata).toBe(true);
      expect(methodMetadata).toBe(true);
      expect(normalMethodMetadata).toBeUndefined();
    });
  });

  describe('use cases', () => {
    it('should mark health check endpoints as public', () => {
      class HealthController {
        @Public()
        healthCheck() {
          return { status: 'ok' };
        }
      }

      const metadata = reflector.get(
        'isPublic',
        HealthController.prototype.healthCheck,
      );
      expect(metadata).toBe(true);
    });

    it('should mark authentication endpoints as public', () => {
      class AuthController {
        @Public()
        login() {}

        @Public()
        register() {}

        @Public()
        forgotPassword() {}

        // This should require authentication
        profile() {}
      }

      const loginMetadata = reflector.get(
        'isPublic',
        AuthController.prototype.login,
      );
      const registerMetadata = reflector.get(
        'isPublic',
        AuthController.prototype.register,
      );
      const forgotPasswordMetadata = reflector.get(
        'isPublic',
        AuthController.prototype.forgotPassword,
      );
      const profileMetadata = reflector.get(
        'isPublic',
        AuthController.prototype.profile,
      );

      expect(loginMetadata).toBe(true);
      expect(registerMetadata).toBe(true);
      expect(forgotPasswordMetadata).toBe(true);
      expect(profileMetadata).toBeUndefined();
    });

    it('should mark documentation endpoints as public', () => {
      class DocsController {
        @Public()
        getApiDocs() {}

        @Public()
        getSwaggerJson() {}
      }

      const docsMetadata = reflector.get(
        'isPublic',
        DocsController.prototype.getApiDocs,
      );
      const swaggerMetadata = reflector.get(
        'isPublic',
        DocsController.prototype.getSwaggerJson,
      );

      expect(docsMetadata).toBe(true);
      expect(swaggerMetadata).toBe(true);
    });
  });

  describe('oil and gas specific use cases', () => {
    it('should mark public regulatory endpoints as public', () => {
      class RegulatoryController {
        @Public()
        getPublicWellData() {}

        @Public()
        getEnvironmentalReports() {}

        // Private regulatory data should require authentication
        getDetailedWellData() {}
      }

      const publicWellMetadata = reflector.get(
        'isPublic',
        RegulatoryController.prototype.getPublicWellData,
      );
      const envReportsMetadata = reflector.get(
        'isPublic',
        RegulatoryController.prototype.getEnvironmentalReports,
      );
      const detailedMetadata = reflector.get(
        'isPublic',
        RegulatoryController.prototype.getDetailedWellData,
      );

      expect(publicWellMetadata).toBe(true);
      expect(envReportsMetadata).toBe(true);
      expect(detailedMetadata).toBeUndefined();
    });

    it('should mark public safety information as public', () => {
      class SafetyController {
        @Public()
        getEmergencyContacts() {}

        @Public()
        getSafetyGuidelines() {}

        // Internal safety reports should require authentication
        getIncidentReports() {}
      }

      const emergencyMetadata = reflector.get(
        'isPublic',
        SafetyController.prototype.getEmergencyContacts,
      );
      const guidelinesMetadata = reflector.get(
        'isPublic',
        SafetyController.prototype.getSafetyGuidelines,
      );
      const incidentMetadata = reflector.get(
        'isPublic',
        SafetyController.prototype.getIncidentReports,
      );

      expect(emergencyMetadata).toBe(true);
      expect(guidelinesMetadata).toBe(true);
      expect(incidentMetadata).toBeUndefined();
    });
  });

  describe('metadata key consistency', () => {
    it('should use consistent metadata key', () => {
      @Public()
      class TestController {}

      // Test that the metadata key is exactly 'isPublic'
      const metadata = reflector.get('isPublic', TestController);
      expect(metadata).toBe(true);

      // Test that other keys don't return the metadata
      const wrongMetadata1 = reflector.get('public', TestController);
      const wrongMetadata2 = reflector.get('is_public', TestController);
      expect(wrongMetadata1).toBeUndefined();
      expect(wrongMetadata2).toBeUndefined();
    });

    it('should always set metadata to true', () => {
      @Public()
      class TestController1 {}

      class TestController2 {
        @Public()
        method() {}
      }

      const classMetadata = reflector.get('isPublic', TestController1);
      const methodMetadata = reflector.get(
        'isPublic',
        TestController2.prototype.method,
      );

      expect(classMetadata).toBe(true);
      expect(methodMetadata).toBe(true);
      expect(classMetadata).toEqual(methodMetadata);
    });
  });

  describe('decorator function behavior', () => {
    it('should be a function that returns a decorator', () => {
      expect(typeof Public).toBe('function');

      const decorator = Public();
      expect(typeof decorator).toBe('function');
    });

    it('should work with multiple calls', () => {
      const decorator1 = Public();
      const decorator2 = Public();

      class TestController1 {
        @decorator1
        method1() {}
      }

      class TestController2 {
        @decorator2
        method2() {}
      }

      const metadata1 = reflector.get(
        'isPublic',
        TestController1.prototype.method1,
      );
      const metadata2 = reflector.get(
        'isPublic',
        TestController2.prototype.method2,
      );

      expect(metadata1).toBe(true);
      expect(metadata2).toBe(true);
    });
  });
});
