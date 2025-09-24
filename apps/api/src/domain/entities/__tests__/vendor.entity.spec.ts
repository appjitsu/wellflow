import { Vendor } from '../vendor.entity';
import {
  VendorType,
  VendorStatus,
  VendorRating,
} from '../../enums/vendor-status.enum';
import { VendorCreatedEvent } from '../../events/vendor-created.event';
import { VendorStatusChangedEvent } from '../../events/vendor-status-changed.event';

describe('Vendor Entity', () => {
  let vendor: Vendor;
  const mockAddress = {
    street: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    country: 'USA',
  };

  beforeEach(() => {
    vendor = new Vendor(
      'vendor-id-123',
      'org-id-456',
      'ACME-001',
      'ACME Corporation',
      VendorType.SERVICE,
      mockAddress,
      'Net 30',
      '12-3456789',
    );
  });

  describe('Constructor', () => {
    it('should create a vendor with correct initial values', () => {
      expect(vendor.getId()).toBe('vendor-id-123');
      expect(vendor.getOrganizationId()).toBe('org-id-456');
      expect(vendor.getVendorCode()).toBe('ACME-001');
      expect(vendor.getVendorName()).toBe('ACME Corporation');
      expect(vendor.getVendorType()).toBe(VendorType.SERVICE);
      expect(vendor.getStatus()).toBe(VendorStatus.PENDING);
      expect(vendor.getBillingAddress()).toEqual(mockAddress);
      expect(vendor.getPaymentTerms()).toBe('Net 30');
      expect(vendor.getTaxId()).toBe('12-3456789');
      expect(vendor.isActive()).toBe(true);
      expect(vendor.isQualified()).toBe(false);
    });

    it('should raise VendorCreatedEvent on creation', () => {
      const events = vendor.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(VendorCreatedEvent);

      const createdEvent = events[0] as VendorCreatedEvent;
      expect(createdEvent.vendorId).toBe('vendor-id-123');
      expect(createdEvent.vendorName).toBe('ACME Corporation');
      expect(createdEvent.vendorType).toBe(VendorType.SERVICE);
    });

    it('should initialize with default performance metrics', () => {
      const metrics = vendor.getPerformanceMetrics();
      expect(metrics.overallRating).toBe(VendorRating.NOT_RATED);
      expect(metrics.safetyRating).toBe(VendorRating.NOT_RATED);
      expect(metrics.qualityRating).toBe(VendorRating.NOT_RATED);
      expect(metrics.timelinessRating).toBe(VendorRating.NOT_RATED);
      expect(metrics.costEffectivenessRating).toBe(VendorRating.NOT_RATED);
      expect(metrics.totalJobsCompleted).toBe(0);
      expect(metrics.averageJobValue).toBe(0);
      expect(metrics.incidentCount).toBe(0);
    });
  });

  describe('Status Management', () => {
    beforeEach(() => {
      vendor.clearDomainEvents(); // Clear creation event
    });

    it('should allow valid status transitions', () => {
      // Pending -> Approved
      vendor.updateStatus(VendorStatus.APPROVED, 'Meets all requirements');
      expect(vendor.getStatus()).toBe(VendorStatus.APPROVED);

      const events = vendor.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(VendorStatusChangedEvent);
    });

    it('should prevent invalid status transitions', () => {
      // Cannot go directly from Pending to Inactive
      expect(() => {
        vendor.updateStatus(VendorStatus.INACTIVE, 'Invalid transition');
      }).toThrow('Cannot transition from pending to inactive');
    });

    it('should allow Approved -> Suspended transition', () => {
      vendor.updateStatus(VendorStatus.APPROVED);
      vendor.clearDomainEvents();

      vendor.updateStatus(VendorStatus.SUSPENDED, 'Safety violation');
      expect(vendor.getStatus()).toBe(VendorStatus.SUSPENDED);

      const events = vendor.getDomainEvents();
      expect(events).toHaveLength(1);

      const statusEvent = events[0] as VendorStatusChangedEvent;
      expect(statusEvent.oldStatus).toBe(VendorStatus.APPROVED);
      expect(statusEvent.newStatus).toBe(VendorStatus.SUSPENDED);
      expect(statusEvent.reason).toBe('Safety violation');
    });

    it('should allow Suspended -> Approved transition', () => {
      vendor.updateStatus(VendorStatus.APPROVED);
      vendor.updateStatus(VendorStatus.SUSPENDED);
      vendor.clearDomainEvents();

      vendor.updateStatus(VendorStatus.APPROVED, 'Issues resolved');
      expect(vendor.getStatus()).toBe(VendorStatus.APPROVED);
    });

    it('should track status change history', () => {
      vendor.updateStatus(VendorStatus.APPROVED);
      vendor.updateStatus(VendorStatus.SUSPENDED);
      vendor.updateStatus(VendorStatus.APPROVED);

      // Should have 4 events total (1 creation + 3 status changes)
      const allEvents = vendor.getDomainEvents();
      const statusEvents = allEvents.filter(
        (e) => e instanceof VendorStatusChangedEvent,
      );
      expect(statusEvents).toHaveLength(3);
    });
  });

  describe('Insurance Management', () => {
    const mockInsurance = {
      generalLiability: {
        carrier: 'State Farm',
        policyNumber: 'GL-123456',
        coverageAmount: 1000000,
        expirationDate: new Date('2024-12-31'),
      },
      workersCompensation: {
        carrier: 'Workers Comp Inc',
        policyNumber: 'WC-789012',
        coverageAmount: 500000,
        expirationDate: new Date('2024-12-31'),
      },
    };

    beforeEach(() => {
      vendor.clearDomainEvents();
    });

    it('should update insurance information', () => {
      vendor.updateInsurance(mockInsurance);

      const insurance = vendor.getInsurance();
      expect(insurance.generalLiability).toEqual(
        mockInsurance.generalLiability,
      );
      expect(insurance.workersCompensation).toEqual(
        mockInsurance.workersCompensation,
      );
    });

    it('should validate minimum insurance requirements', () => {
      const insufficientInsurance = {
        generalLiability: {
          carrier: 'State Farm',
          policyNumber: 'GL-123456',
          coverageAmount: 100000, // Below minimum
          expirationDate: new Date('2024-12-31'),
        },
      };

      expect(() => {
        vendor.updateInsurance(insufficientInsurance);
      }).toThrow('General liability coverage must be at least $500,000');
    });

    it('should check for expired insurance', () => {
      const expiredInsurance = {
        generalLiability: {
          carrier: 'State Farm',
          policyNumber: 'GL-123456',
          coverageAmount: 1000000,
          expirationDate: new Date('2020-12-31'), // Expired
        },
      };

      expect(() => {
        vendor.updateInsurance(expiredInsurance);
      }).toThrow('Insurance policy has expired');
    });

    it('should validate insurance for different vendor types', () => {
      const drillingVendor = new Vendor(
        'drilling-vendor-id',
        'org-id-456',
        'DRILL-001',
        'Drilling Corp',
        VendorType.DRILLING_CONTRACTOR,
        mockAddress,
        'Net 30',
      );

      const basicInsurance = {
        generalLiability: {
          carrier: 'State Farm',
          policyNumber: 'GL-123456',
          coverageAmount: 1000000,
          expirationDate: new Date('2024-12-31'),
        },
      };

      // Drilling contractors should require additional insurance
      expect(() => {
        drillingVendor.updateInsurance(basicInsurance);
      }).toThrow(
        'Drilling contractors must have environmental liability insurance',
      );
    });
  });

  describe('Performance Management', () => {
    beforeEach(() => {
      vendor.clearDomainEvents();
    });

    it('should update performance ratings', () => {
      vendor.updatePerformanceRating(
        VendorRating.EXCELLENT,
        VendorRating.GOOD,
        VendorRating.EXCELLENT,
        VendorRating.GOOD,
        VendorRating.EXCELLENT,
      );

      const metrics = vendor.getPerformanceMetrics();
      expect(metrics.overallRating).toBe(VendorRating.EXCELLENT);
      expect(metrics.safetyRating).toBe(VendorRating.GOOD);
      expect(metrics.qualityRating).toBe(VendorRating.EXCELLENT);
      expect(metrics.timelinessRating).toBe(VendorRating.GOOD);
      expect(metrics.costEffectivenessRating).toBe(VendorRating.EXCELLENT);
    });

    it('should calculate average performance rating', () => {
      vendor.updatePerformanceRating(
        VendorRating.EXCELLENT, // 5
        VendorRating.GOOD, // 4
        VendorRating.AVERAGE, // 3
        VendorRating.GOOD, // 4
        VendorRating.EXCELLENT, // 5
      );

      const averageRating = vendor.calculateAveragePerformanceRating();
      expect(averageRating).toBe(4.2); // (5+4+3+4+5)/5 = 4.2
    });

    it('should track job completion metrics', () => {
      vendor.recordJobCompletion(50000, true, false); // $50k, on time, no incidents
      vendor.recordJobCompletion(75000, false, true); // $75k, late, incident

      const metrics = vendor.getPerformanceMetrics();
      expect(metrics.totalJobsCompleted).toBe(2);
      expect(metrics.averageJobValue).toBe(62500); // (50000 + 75000) / 2
      expect(metrics.incidentCount).toBe(1);
    });

    it('should update qualification status based on performance', () => {
      // High performance should lead to qualification
      vendor.updatePerformanceRating(
        VendorRating.EXCELLENT,
        VendorRating.EXCELLENT,
        VendorRating.EXCELLENT,
        VendorRating.EXCELLENT,
        VendorRating.EXCELLENT,
      );

      // Add valid insurance
      const validInsurance = {
        generalLiability: {
          carrier: 'State Farm',
          policyNumber: 'GL-123456',
          coverageAmount: 1000000,
          expirationDate: new Date('2024-12-31'),
        },
      };
      vendor.updateInsurance(validInsurance);

      // Should now be qualified
      expect(vendor.isQualified()).toBe(true);
    });
  });

  describe('Certification Management', () => {
    beforeEach(() => {
      vendor.clearDomainEvents();
    });

    it('should add certifications', () => {
      const certification = {
        name: 'ISO 9001',
        issuingBody: 'ISO',
        certificationNumber: 'ISO-9001-2023',
        issueDate: new Date('2023-01-01'),
        expirationDate: new Date('2026-01-01'),
      };

      vendor.addCertification(certification);

      const certifications = vendor.getCertifications();
      expect(certifications).toHaveLength(1);
      expect(certifications[0]).toEqual(certification);
    });

    it('should prevent duplicate certifications', () => {
      const certification = {
        name: 'ISO 9001',
        issuingBody: 'ISO',
        certificationNumber: 'ISO-9001-2023',
        issueDate: new Date('2023-01-01'),
        expirationDate: new Date('2026-01-01'),
      };

      vendor.addCertification(certification);

      expect(() => {
        vendor.addCertification(certification);
      }).toThrow('Certification ISO 9001 already exists');
    });

    it('should validate certification expiration dates', () => {
      const expiredCertification = {
        name: 'ISO 9001',
        issuingBody: 'ISO',
        certificationNumber: 'ISO-9001-2020',
        issueDate: new Date('2020-01-01'),
        expirationDate: new Date('2023-01-01'), // Expired
      };

      expect(() => {
        vendor.addCertification(expiredCertification);
      }).toThrow('Certification has expired');
    });

    it('should identify expiring certifications', () => {
      const soonToExpire = {
        name: 'ISO 9001',
        issuingBody: 'ISO',
        certificationNumber: 'ISO-9001-2024',
        issueDate: new Date('2023-01-01'),
        expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      };

      vendor.addCertification(soonToExpire);

      const expiringCerts = vendor.getExpiringCertifications(30); // Within 30 days
      expect(expiringCerts).toHaveLength(1);
      expect(expiringCerts[0].name).toBe('ISO 9001');
    });
  });

  describe('Business Rules', () => {
    it('should enforce vendor code format', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new Vendor(
          'vendor-id',
          'org-id',
          'ab', // Too short
          'Test Vendor',
          VendorType.SERVICE,
          mockAddress,
          'Net 30',
        );
      }).toThrow('Vendor code must be between 3 and 20 characters');
    });

    it('should enforce vendor name requirements', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new Vendor(
          'vendor-id',
          'org-id',
          'TEST-001',
          '', // Empty name
          VendorType.SERVICE,
          mockAddress,
          'Net 30',
        );
      }).toThrow('Vendor name is required');
    });

    it('should validate address completeness', () => {
      const incompleteAddress = {
        street: '123 Main St',
        city: '', // Missing city
        state: 'TX',
        zipCode: '77001',
        country: 'USA',
      };

      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new Vendor(
          'vendor-id',
          'org-id',
          'TEST-001',
          'Test Vendor',
          VendorType.SERVICE,
          incompleteAddress,
          'Net 30',
        );
      }).toThrow('Address city is required');
    });
  });

  describe('Domain Events', () => {
    it('should clear domain events', () => {
      expect(vendor.getDomainEvents()).toHaveLength(1); // Creation event

      vendor.clearDomainEvents();
      expect(vendor.getDomainEvents()).toHaveLength(0);
    });

    it('should accumulate multiple events', () => {
      vendor.updateStatus(VendorStatus.APPROVED);
      vendor.updatePerformanceRating(
        VendorRating.EXCELLENT,
        VendorRating.GOOD,
        VendorRating.EXCELLENT,
        VendorRating.GOOD,
        VendorRating.EXCELLENT,
      );

      const events = vendor.getDomainEvents();
      expect(events.length).toBeGreaterThan(1);
    });
  });
});
