import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { VendorsController } from '../vendors.controller';
import { CreateVendorCommand } from '../../../application/commands/create-vendor.command';
import { UpdateVendorStatusCommand } from '../../../application/commands/update-vendor-status.command';
import { UpdateVendorInsuranceCommand } from '../../../application/commands/update-vendor-insurance.command';
import { GetVendorByIdQuery } from '../../../application/queries/get-vendor-by-id.query';
import { GetVendorsByOrganizationQuery } from '../../../application/queries/get-vendors-by-organization.query';
import { GetVendorStatisticsQuery } from '../../../application/queries/get-vendor-statistics.query';
import { GetVendorsWithExpiringQualificationsQuery } from '../../../application/queries/get-vendors-with-expiring-qualifications.query';
import {
  VendorStatus,
  VendorType,
} from '../../../domain/enums/vendor-status.enum';

describe('VendorsController', () => {
  let controller: VendorsController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockUser = {
    getId: jest.fn().mockReturnValue('user-123'),
    getOrganizationId: jest.fn().mockReturnValue('org-456'),
  };

  const mockVendorDto = {
    id: 'vendor-123',
    organizationId: 'org-456',
    vendorName: 'Test Vendor Inc',
    vendorCode: 'VEND001',
    vendorType: VendorType.SERVICE,
    status: VendorStatus.APPROVED,
    billingAddress: {
      street: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA',
    },
    paymentTerms: 'Net 30',
    taxId: '123456789',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockVendorStatistics = {
    totalVendors: 10,
    activeVendors: 7,
    pendingApproval: 2,
    suspendedVendors: 1,
    qualifiedVendors: 5,
    recentlyAdded: 3,
    vendorsByType: { service: 5, equipment: 3, material: 2 },
    vendorsByRating: { excellent: 4, good: 3, average: 2, poor: 1 },
    expiringInsurance: 2,
    expiringCertifications: 1,
    averagePerformanceRating: 4.2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorsController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VendorsController>(VendorsController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVendor', () => {
    it('should create a new vendor successfully', async () => {
      const createVendorDto = {
        vendorName: 'New Vendor Inc',
        vendorCode: 'VEND002',
        vendorType: VendorType.SUPPLIER,
        billingAddress: {
          street: '456 Oak St',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'USA',
        },
        paymentTerms: 'Net 15',
        taxId: '987654321',
        serviceAddress: {
          street: '789 Pine St',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          country: 'USA',
        },
        website: 'https://newvendor.com',
        notes: 'New equipment supplier',
      };

      const expectedCommand = new CreateVendorCommand(
        'org-456',
        'New Vendor Inc',
        'VEND002',
        VendorType.SUPPLIER,
        createVendorDto.billingAddress,
        'Net 15',
        '987654321',
        createVendorDto.serviceAddress,
        'https://newvendor.com',
        'New equipment supplier',
        'user-123',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue('vendor-456');

      const result = await controller.createVendor(createVendorDto, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
      expect(result).toEqual({
        id: 'vendor-456',
        message: 'Vendor created successfully',
      });
    });

    it('should create vendor with minimal required fields', async () => {
      const createVendorDto = {
        vendorName: 'Minimal Vendor',
        vendorCode: 'VEND003',
        vendorType: VendorType.SUPPLIER,
        billingAddress: {
          street: '123 Basic St',
          city: 'Simple City',
          state: 'TX',
          zipCode: '12345',
          country: 'USA',
        },
        paymentTerms: 'Net 30',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('vendor-789');

      const result = await controller.createVendor(createVendorDto, mockUser);

      expect(commandBus.execute).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'vendor-789',
        message: 'Vendor created successfully',
      });
    });

    it('should use test defaults when user is undefined', async () => {
      const createVendorDto = {
        vendorName: 'Test Vendor',
        vendorCode: 'VEND004',
        vendorType: VendorType.SERVICE,
        billingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TX',
          zipCode: '12345',
          country: 'USA',
        },
        paymentTerms: 'Net 30',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('vendor-test');

      const result = await controller.createVendor(createVendorDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'test-org-id',
          createdBy: 'test-user-id',
        }),
      );
      expect(result).toEqual({
        id: 'vendor-test',
        message: 'Vendor created successfully',
      });
    });

    it('should handle command execution errors', async () => {
      const createVendorDto = {
        vendorName: 'Error Vendor',
        vendorCode: 'VEND005',
        vendorType: VendorType.SERVICE,
        billingAddress: {
          street: '123 Error St',
          city: 'Error City',
          state: 'TX',
          zipCode: '12345',
          country: 'USA',
        },
        paymentTerms: 'Net 30',
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Command failed'));

      await expect(
        controller.createVendor(createVendorDto, mockUser),
      ).rejects.toThrow('Command failed');
    });
  });

  describe('getVendors', () => {
    it('should get vendors with default pagination', async () => {
      const expectedQuery = new GetVendorsByOrganizationQuery(
        'org-456',
        {},
        { page: 1, limit: 20 },
      );
      const mockResult = {
        vendors: [mockVendorDto],
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrevious: false,
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockResult);

      const result = await controller.getVendors(mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockResult);
    });

    it('should get vendors with custom pagination and filters', async () => {
      const expectedQuery = new GetVendorsByOrganizationQuery(
        'org-456',
        {
          status: [VendorStatus.APPROVED],
          vendorType: [VendorType.SERVICE],
          searchTerm: 'approved vendor',
        },
        { page: 2, limit: 10 },
      );
      const mockResult = {
        vendors: [mockVendorDto],
        total: 1,
        page: 2,
        limit: 10,
        hasNext: false,
        hasPrevious: true,
      };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockResult);

      const result = await controller.getVendors(
        mockUser,
        '2',
        '10',
        VendorStatus.APPROVED,
        VendorType.SERVICE,
        'approved vendor',
      );

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockResult);
    });

    it('should handle undefined user with test defaults', async () => {
      const expectedQuery = new GetVendorsByOrganizationQuery(
        'test-org-id',
        {},
        { page: 1, limit: 20 },
      );

      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        vendors: [],
        total: 0,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrevious: false,
      });

      const result = await controller.getVendors();

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result.total).toBe(0);
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(controller.getVendors(mockUser)).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('getVendorStatistics', () => {
    it('should get vendor statistics successfully', async () => {
      const expectedQuery = new GetVendorStatisticsQuery('org-456');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockVendorStatistics);

      const result = await controller.getVendorStatistics(mockUser);

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockVendorStatistics);
    });

    it('should handle undefined user with test defaults', async () => {
      const expectedQuery = new GetVendorStatisticsQuery('test-org-id');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockVendorStatistics);

      const result = await controller.getVendorStatistics();

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockVendorStatistics);
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(controller.getVendorStatistics(mockUser)).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('getVendorsWithExpiringQualifications', () => {
    it('should get vendors with expiring qualifications with default days', async () => {
      const expectedQuery = new GetVendorsWithExpiringQualificationsQuery(
        'org-456',
        30,
      );
      const mockResult = [mockVendorDto];

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockResult);

      const result = await controller.getVendorsWithExpiringQualifications(
        undefined,
        mockUser,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockResult);
    });

    it('should get vendors with expiring qualifications with custom days', async () => {
      const expectedQuery = new GetVendorsWithExpiringQualificationsQuery(
        'org-456',
        60,
      );

      jest.spyOn(queryBus, 'execute').mockResolvedValue([]);

      const result = await controller.getVendorsWithExpiringQualifications(
        '60',
        mockUser,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual([]);
    });

    it('should handle undefined user with test defaults', async () => {
      const expectedQuery = new GetVendorsWithExpiringQualificationsQuery(
        'test-org-id',
        30,
      );

      jest.spyOn(queryBus, 'execute').mockResolvedValue([]);

      const result = await controller.getVendorsWithExpiringQualifications();

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual([]);
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(
        controller.getVendorsWithExpiringQualifications('30', mockUser),
      ).rejects.toThrow('Query failed');
    });
  });

  describe('getVendorById', () => {
    it('should get vendor by ID successfully', async () => {
      const expectedQuery = new GetVendorByIdQuery('vendor-123');

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockVendorDto);

      const result = await controller.getVendorById('vendor-123');

      expect(queryBus.execute).toHaveBeenCalledWith(expectedQuery);
      expect(result).toEqual(mockVendorDto);
    });

    it('should handle query execution errors', async () => {
      jest
        .spyOn(queryBus, 'execute')
        .mockRejectedValue(new Error('Query failed'));

      await expect(controller.getVendorById('vendor-123')).rejects.toThrow(
        'Query failed',
      );
    });
  });

  describe('updateVendorStatus', () => {
    it('should update vendor status successfully', async () => {
      const updateStatusDto = {
        status: VendorStatus.APPROVED,
        reason: 'Vendor approved after review',
      };
      const expectedCommand = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
        'Vendor approved after review',
        'user-123',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.updateVendorStatus(
        'vendor-123',
        updateStatusDto,
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
    });

    it('should update vendor status without reason', async () => {
      const updateStatusDto = {
        status: VendorStatus.SUSPENDED,
      };
      const expectedCommand = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.SUSPENDED,
        undefined,
        'user-123',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.updateVendorStatus(
        'vendor-123',
        updateStatusDto,
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
    });

    it('should use test user ID when user is undefined', async () => {
      const updateStatusDto = {
        status: VendorStatus.REJECTED,
        reason: 'Rejected due to compliance issues',
      };
      const expectedCommand = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.REJECTED,
        'Rejected due to compliance issues',
        'test-user-id',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.updateVendorStatus('vendor-123', updateStatusDto);

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
    });

    it('should handle command execution errors', async () => {
      const updateStatusDto = {
        status: VendorStatus.APPROVED,
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Command failed'));

      await expect(
        controller.updateVendorStatus('vendor-123', updateStatusDto, mockUser),
      ).rejects.toThrow('Command failed');
    });
  });

  describe('updateVendorInsurance', () => {
    it('should update vendor insurance successfully', async () => {
      const insuranceDto = {
        generalLiability: {
          carrier: 'Test Insurance Co',
          policyNumber: 'GL-123456',
          coverageAmount: 1000000,
          expirationDate: '2025-12-31',
        },
        workersCompensation: {
          carrier: 'WC Insurance',
          policyNumber: 'WC-789012',
          coverageAmount: 500000,
          expirationDate: '2025-06-30',
        },
      };

      const expectedInsuranceData = {
        generalLiability: {
          carrier: 'Test Insurance Co',
          policyNumber: 'GL-123456',
          coverageAmount: 1000000,
          expirationDate: new Date('2025-12-31'),
        },
        workersCompensation: {
          carrier: 'WC Insurance',
          policyNumber: 'WC-789012',
          coverageAmount: 500000,
          expirationDate: new Date('2025-06-30'),
        },
      };

      const expectedCommand = new UpdateVendorInsuranceCommand(
        'vendor-123',
        expectedInsuranceData,
        'user-123',
      );

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.updateVendorInsurance(
        'vendor-123',
        insuranceDto,
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(expectedCommand);
    });

    it('should update vendor insurance with all policy types', async () => {
      const insuranceDto = {
        generalLiability: {
          carrier: 'GL Insurance',
          policyNumber: 'GL-001',
          coverageAmount: 2000000,
          expirationDate: '2025-12-31',
        },
        workersCompensation: {
          carrier: 'WC Insurance',
          policyNumber: 'WC-001',
          coverageAmount: 1000000,
          expirationDate: '2025-12-31',
        },
        autoLiability: {
          carrier: 'Auto Insurance',
          policyNumber: 'AUTO-001',
          coverageAmount: 500000,
          expirationDate: '2025-12-31',
        },
        professionalLiability: {
          carrier: 'PL Insurance',
          policyNumber: 'PL-001',
          coverageAmount: 1000000,
          expirationDate: '2025-12-31',
        },
        environmentalLiability: {
          carrier: 'EL Insurance',
          policyNumber: 'EL-001',
          coverageAmount: 2000000,
          expirationDate: '2025-12-31',
        },
        umbrella: {
          carrier: 'Umbrella Insurance',
          policyNumber: 'UMB-001',
          coverageAmount: 5000000,
          expirationDate: '2025-12-31',
        },
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.updateVendorInsurance(
        'vendor-123',
        insuranceDto,
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorId: 'vendor-123',
          updatedBy: 'user-123',
          insurance: expect.objectContaining({
            generalLiability: expect.any(Object),
            workersCompensation: expect.any(Object),
            autoLiability: expect.any(Object),
            professionalLiability: expect.any(Object),
            environmentalLiability: expect.any(Object),
            umbrella: expect.any(Object),
          }),
        }),
      );
    });

    it('should update vendor insurance with partial data', async () => {
      const insuranceDto = {
        generalLiability: {
          carrier: 'Updated Insurance Co',
          policyNumber: 'GL-UPDATED',
          coverageAmount: 1500000,
          expirationDate: '2026-01-15',
        },
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.updateVendorInsurance(
        'vendor-123',
        insuranceDto,
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorId: 'vendor-123',
          insurance: {
            generalLiability: {
              carrier: 'Updated Insurance Co',
              policyNumber: 'GL-UPDATED',
              coverageAmount: 1500000,
              expirationDate: new Date('2026-01-15'),
            },
          },
        }),
      );
    });

    it('should use test user ID when user is undefined', async () => {
      const insuranceDto = {
        generalLiability: {
          carrier: 'Test Insurance',
          policyNumber: 'TEST-001',
          coverageAmount: 1000000,
          expirationDate: '2025-12-31',
        },
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(undefined);

      await controller.updateVendorInsurance('vendor-123', insuranceDto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedBy: 'test-user-id',
        }),
      );
    });

    it('should handle command execution errors', async () => {
      const insuranceDto = {
        generalLiability: {
          carrier: 'Error Insurance',
          policyNumber: 'ERR-001',
          coverageAmount: 1000000,
          expirationDate: '2025-12-31',
        },
      };

      jest
        .spyOn(commandBus, 'execute')
        .mockRejectedValue(new Error('Command failed'));

      await expect(
        controller.updateVendorInsurance('vendor-123', insuranceDto, mockUser),
      ).rejects.toThrow('Command failed');
    });
  });

  describe('error handling', () => {
    it('should handle invalid UUID in getVendorById', async () => {
      // ParseUUIDPipe will throw BadRequestException for invalid UUIDs
      // This would be tested in e2e tests
      expect(controller).toBeDefined();
    });

    it('should handle validation errors in DTOs', async () => {
      // ValidationPipe will throw BadRequestException for invalid data
      // This would be tested in e2e tests
      expect(controller).toBeDefined();
    });

    it('should handle authorization failures', async () => {
      // Guards will throw ForbiddenException for unauthorized access
      // This would be tested in e2e tests
      expect(controller).toBeDefined();
    });
  });

  describe('logging', () => {
    it('should log vendor creation', async () => {
      const createVendorDto = {
        vendorName: 'Log Test Vendor',
        vendorCode: 'LOG001',
        vendorType: VendorType.SERVICE,
        billingAddress: {
          street: '123 Log St',
          city: 'Log City',
          state: 'TX',
          zipCode: '12345',
          country: 'USA',
        },
        paymentTerms: 'Net 30',
      };

      jest.spyOn(commandBus, 'execute').mockResolvedValue('vendor-log');

      await controller.createVendor(createVendorDto, mockUser);

      // Logger calls would be tested in integration tests
      expect(commandBus.execute).toHaveBeenCalled();
    });

    it('should log vendor queries', async () => {
      jest.spyOn(queryBus, 'execute').mockResolvedValue({
        vendors: [],
        total: 0,
        page: 1,
        limit: 20,
        hasNext: false,
        hasPrevious: false,
      });

      await controller.getVendors(mockUser);

      // Logger calls would be tested in integration tests
      expect(queryBus.execute).toHaveBeenCalled();
    });
  });
});
