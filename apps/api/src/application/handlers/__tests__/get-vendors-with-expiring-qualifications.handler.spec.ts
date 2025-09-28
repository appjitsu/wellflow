import { Test, TestingModule } from '@nestjs/testing';
import { GetVendorsWithExpiringQualificationsHandler } from '../get-vendors-with-expiring-qualifications.handler';
import { GetVendorsWithExpiringQualificationsQuery } from '../../queries/get-vendors-with-expiring-qualifications.query';
import { VendorRepository } from '../../../domain/repositories/vendor.repository.interface';
import { Vendor } from '../../../domain/entities/vendor.entity';
import {
  VendorType,
  VendorStatus,
  VendorRating,
} from '../../../domain/enums/vendor-status.enum';

describe('GetVendorsWithExpiringQualificationsHandler', () => {
  let handler: GetVendorsWithExpiringQualificationsHandler;
  let vendorRepository: jest.Mocked<VendorRepository>;

  const createMockVendor = (
    id: string = 'vendor-1',
    name: string = 'Test Vendor Inc',
  ) => {
    const vendor = new Vendor(
      id,
      'org-123',
      `VENDOR-${id.split('-')[1]?.padStart(3, '0') ?? '001'}`,
      name,
      VendorType.SERVICE,
      mockAddress,
      'Net 30',
    );
    vendor.updateInsurance(mockInsurance);
    vendor.addCertification(mockCertification);
    return vendor;
  };

  const mockAddress = {
    street: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    country: 'USA',
  };

  const mockInsurance = {
    generalLiability: {
      carrier: 'Test Insurance Co',
      policyNumber: 'GL-12345',
      coverageAmount: 5000000,
      expirationDate: new Date('2025-12-31'),
    },
    workersCompensation: {
      carrier: 'WC Insurance',
      policyNumber: 'WC-67890',
      coverageAmount: 1000000,
      expirationDate: new Date('2025-11-15'),
    },
    environmentalLiability: {
      carrier: 'Environmental Insurance',
      policyNumber: 'ENV-11111',
      coverageAmount: 2000000,
      expirationDate: new Date('2025-10-20'),
    },
  };

  const mockCertification = {
    id: 'cert-1',
    name: 'OSHA Safety Certification',
    issuingBody: 'OSHA',
    certificationNumber: 'OSHA-123',
    issueDate: new Date('2023-01-01'),
    expirationDate: new Date('2025-10-15'),
    isActive: true,
  };

  beforeEach(async () => {
    const mockVendorRepository = {
      findWithExpiringQualifications: jest.fn(),
      findById: jest.fn(),
      findByVendorCode: jest.fn(),
      save: jest.fn(),
      findByOrganization: jest.fn(),
      findByStatus: jest.fn(),
      findByType: jest.fn(),
      findWithExpiringInsurance: jest.fn(),
      findWithExpiringCertifications: jest.fn(),
      findByPerformanceRating: jest.fn(),
      search: jest.fn(),
      existsByVendorCode: jest.fn(),
      delete: jest.fn(),
      getVendorStatistics: jest.fn(),
      findRequiringQualificationRenewal: jest.fn(),
      bulkUpdateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVendorsWithExpiringQualificationsHandler,
        {
          provide: 'VendorRepository',
          useValue: mockVendorRepository,
        },
      ],
    }).compile();

    handler = module.get<GetVendorsWithExpiringQualificationsHandler>(
      GetVendorsWithExpiringQualificationsHandler,
    );
    vendorRepository = module.get('VendorRepository');
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should return vendors with expiring qualifications mapped to DTOs', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith('org-123', 30);

      const vendorDto = result[0]!;
      expect(vendorDto.id).toBe('vendor-1');
      expect(vendorDto.vendorName).toBe('Test Vendor Inc');
      expect(vendorDto.vendorCode).toBe('VENDOR-001');
      expect(vendorDto.vendorType).toBe(VendorType.SERVICE);
      expect(vendorDto.status).toBe(VendorStatus.PREQUALIFIED);
      expect(vendorDto.isPrequalified).toBe(true);
      expect(vendorDto.isActive).toBe(true);
      expect(vendorDto.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
      expect(vendorDto.updatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should map insurance to DTO format correctly', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        60,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      const vendorDto = result[0]!;
      expect(vendorDto.insurance).toBeDefined();
      expect(vendorDto.insurance?.generalLiability.carrier).toBe(
        'Test Insurance Co',
      );
      expect(vendorDto.insurance?.generalLiability.policyNumber).toBe(
        'GL-12345',
      );
      expect(vendorDto.insurance?.generalLiability.coverageAmount).toBe(
        5000000,
      );
      expect(vendorDto.insurance?.generalLiability.expirationDate).toBe(
        '2025-12-31T00:00:00.000Z',
      );

      expect(vendorDto.insurance?.workersCompensation).toBeDefined();
      expect(vendorDto.insurance?.workersCompensation?.carrier).toBe(
        'WC Insurance',
      );
      expect(vendorDto.insurance?.workersCompensation?.policyNumber).toBe(
        'WC-67890',
      );
      expect(vendorDto.insurance?.workersCompensation?.coverageAmount).toBe(
        1000000,
      );
      expect(vendorDto.insurance?.workersCompensation?.expirationDate).toBe(
        '2025-11-15T00:00:00.000Z',
      );
    });

    it('should map certifications to DTO format correctly', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        90,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      const vendorDto = result[0]!;
      expect(vendorDto.certifications).toHaveLength(1);
      const certDto = vendorDto.certifications[0]!;
      expect(certDto.name).toBe('OSHA Safety Certification');
      expect(certDto.issuingBody).toBe('OSHA');
      expect(certDto.certificationNumber).toBe('OSHA-123');
      expect(certDto.issueDate).toBe('2023-01-01T00:00:00.000Z');
      expect(certDto.expirationDate).toBe('2025-10-15T00:00:00.000Z');
    });

    it('should map performance metrics correctly', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      const vendorDto = result[0]!;
      expect(vendorDto.overallRating).toBe(VendorRating.NOT_RATED);
      expect(vendorDto.safetyRating).toBe(VendorRating.NOT_RATED);
      expect(vendorDto.qualityRating).toBe(VendorRating.NOT_RATED);
      expect(vendorDto.timelinessRating).toBe(VendorRating.NOT_RATED);
      expect(vendorDto.costEffectivenessRating).toBe(VendorRating.NOT_RATED);
      expect(vendorDto.totalJobsCompleted).toBe(0);
      expect(vendorDto.averageJobValue).toBe(0);
      expect(vendorDto.incidentCount).toBe(0);
      expect(vendorDto.lastEvaluationDate).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should handle vendors without insurance', async () => {
      // Arrange
      const vendorWithoutInsurance = new Vendor(
        'vendor-2',
        'org-123',
        'VENDOR-002',
        'No Insurance Vendor',
        VendorType.SUPPLIER,
        mockAddress,
        'Net 15',
      );

      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        vendorWithoutInsurance,
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      const vendorDto = result[0]!;
      expect(vendorDto.insurance).toBeUndefined();
    });

    it('should handle vendors without certifications', async () => {
      // Arrange
      const vendorWithoutCerts = new Vendor(
        'vendor-3',
        'org-123',
        'VENDOR-003',
        'No Certs Vendor',
        VendorType.CONSULTANT,
        mockAddress,
        'Net 30',
      );

      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        vendorWithoutCerts,
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      const vendorDto = result[0]!;
      expect(vendorDto.certifications).toEqual([]);
    });

    it('should handle different days until expiration', async () => {
      // Test various expiration day values
      const testCases = [7, 30, 60, 90, 180];

      for (const days of testCases) {
        const query = new GetVendorsWithExpiringQualificationsQuery(
          'org-123',
          days,
        );
        vendorRepository.findWithExpiringQualifications.mockResolvedValue([
          createMockVendor(),
        ]);

        const result = await handler.execute(query);

        expect(result).toHaveLength(1);
        expect(
          vendorRepository.findWithExpiringQualifications,
        ).toHaveBeenCalledWith('org-123', days);
      }
    });

    it('should handle different organization IDs correctly', async () => {
      // Test various organization ID formats
      const testCases = [
        'org-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-org',
        'org_with_underscores',
        'org-with-dashes',
      ];

      for (const orgId of testCases) {
        const query = new GetVendorsWithExpiringQualificationsQuery(orgId, 30);
        vendorRepository.findWithExpiringQualifications.mockResolvedValue([
          createMockVendor(),
        ]);

        const result = await handler.execute(query);

        expect(result).toHaveLength(1);
        expect(
          vendorRepository.findWithExpiringQualifications,
        ).toHaveBeenCalledWith(orgId, 30);
      }
    });

    it('should return empty array when no vendors found', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      const repositoryError = new Error('Database connection failed');
      vendorRepository.findWithExpiringQualifications.mockRejectedValue(
        repositoryError,
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database connection failed',
      );

      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith('org-123', 30);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      vendorRepository.findWithExpiringQualifications.mockImplementation(() =>
        Promise.reject(nonErrorException),
      );

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith('org-123', 30);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle empty organization ID', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery('', 30);
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith('', 30);
    });

    it('should handle null organization ID', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        null as any,
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith(null, 30);
    });

    it('should handle undefined organization ID', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        undefined as any,
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith(undefined, 30);
    });

    it('should handle zero days until expiration', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery('org-123', 0);
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith('org-123', 0);
    });

    it('should handle negative days until expiration', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        -30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(
        vendorRepository.findWithExpiringQualifications,
      ).toHaveBeenCalledWith('org-123', -30);
    });

    it('should return DTOs with all expected properties', async () => {
      // Arrange
      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      const vendorDto = result[0]!;
      expect(vendorDto).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          organizationId: expect.any(String),
          vendorName: expect.any(String),
          vendorCode: expect.any(String),
          vendorType: expect.any(String),
          status: expect.any(String),
          billingAddress: expect.any(Object),
          paymentTerms: expect.any(String),
          certifications: expect.any(Array),
          isPrequalified: expect.any(Boolean),
          overallRating: expect.any(String),
          safetyRating: expect.any(String),
          qualityRating: expect.any(String),
          timelinessRating: expect.any(String),
          costEffectivenessRating: expect.any(String),
          totalJobsCompleted: expect.any(Number),
          averageJobValue: expect.any(Number),
          incidentCount: expect.any(Number),
          isActive: expect.any(Boolean),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });

    it('should handle multiple vendors with different qualification states', async () => {
      // Arrange
      const vendor2 = new Vendor(
        'vendor-2',
        'org-123',
        'VENDOR-002',
        'Second Vendor',
        VendorType.CONTRACTOR,
        mockAddress,
        'Net 15',
      );

      const vendor3 = new Vendor(
        'vendor-3',
        'org-123',
        'VENDOR-003',
        'Third Vendor',
        VendorType.SUPPLIER,
        mockAddress,
        'Net 60',
      );

      const query = new GetVendorsWithExpiringQualificationsQuery(
        'org-123',
        30,
      );
      vendorRepository.findWithExpiringQualifications.mockResolvedValue([
        createMockVendor(),
        vendor2,
        vendor3,
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(3);
      expect(result.map((v) => v.id)).toEqual([
        'vendor-1',
        'vendor-2',
        'vendor-3',
      ]);
      expect(result.map((v) => v.vendorName)).toEqual([
        'Test Vendor Inc',
        'Second Vendor',
        'Third Vendor',
      ]);
    });
  });
});
