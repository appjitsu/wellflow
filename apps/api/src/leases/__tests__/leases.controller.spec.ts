import { Test, TestingModule } from '@nestjs/testing';
import { LeasesController } from '../leases.controller';
import { LeasesService } from '../leases.service';
import { ValidationService } from '@/common/validation/validation.service';
import { TenantGuard } from '@/common/tenant/tenant.guard';
import { AbilitiesGuard } from '@/authorization/abilities.guard';
import { AbilitiesFactory } from '@/authorization/abilities.factory';

describe('LeasesController', () => {
  let controller: LeasesController;
  let mockLeasesService: jest.Mocked<LeasesService>;
  let mockValidationService: jest.Mocked<ValidationService>;

  const mockLease = {
    id: 'lease-123',
    organizationId: 'org-123',
    name: 'Test Lease',
    leaseNumber: 'L-001',
    lessor: 'Test Lessor',
    lessee: 'Test Lessee',
    acreage: '100.50',
    royaltyRate: '0.1875',
    effectiveDate: '2024-01-01',
    expirationDate: '2029-01-01',
    status: 'active',
    legalDescription: 'Test legal description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockLeasesService = {
      createLease: jest.fn(),
      getLeaseById: jest.fn(),
      getLeases: jest.fn(),
      updateLease: jest.fn(),
      deleteLease: jest.fn(),
      getLeasesByStatus: jest.fn(),
      getExpiringLeases: jest.fn(),
    } as any;

    mockValidationService = {
      validate: jest.fn(),
      schemas: {
        id: { parse: jest.fn() },
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeasesController],
      providers: [
        {
          provide: LeasesService,
          useValue: mockLeasesService,
        },
        {
          provide: ValidationService,
          useValue: mockValidationService,
        },
        AbilitiesGuard,
        {
          provide: AbilitiesFactory,
          useValue: {
            createForUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<LeasesController>(LeasesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createLease', () => {
    it('should create a lease successfully', async () => {
      const createDto = {
        name: 'Test Lease',
        lessor: 'Test Lessor',
        lessee: 'Test Lessee',
        leaseNumber: 'L-001',
        acreage: '100.50',
        royaltyRate: '0.1875',
        effectiveDate: '2024-01-01',
        expirationDate: '2029-01-01',
        legalDescription: 'Test legal description',
      };

      mockValidationService.validate.mockReturnValue(createDto);
      mockLeasesService.createLease.mockResolvedValue(mockLease);

      const result = await controller.createLease(createDto);

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        expect.any(Object),
        createDto,
      );
      expect(mockLeasesService.createLease).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockLease);
    });

    it('should throw validation error for invalid data', async () => {
      const invalidDto = {
        name: '',
        lessor: '',
        lessee: '',
      };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(controller.createLease(invalidDto)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('getLeases', () => {
    it('should return all leases when no status filter', async () => {
      const mockLeases = [mockLease];
      mockLeasesService.getLeases.mockResolvedValue(mockLeases);

      const result = await controller.getLeases();

      expect(mockLeasesService.getLeases).toHaveBeenCalled();
      expect(result).toEqual(mockLeases);
    });

    it('should return leases by status when status filter provided', async () => {
      const mockLeases = [mockLease];
      mockLeasesService.getLeasesByStatus.mockResolvedValue(mockLeases);

      const result = await controller.getLeases('active');

      expect(mockLeasesService.getLeasesByStatus).toHaveBeenCalledWith(
        'active',
      );
      expect(result).toEqual(mockLeases);
    });
  });

  describe('getExpiringLeases', () => {
    it('should return expiring leases with default days', async () => {
      const mockLeases = [mockLease];
      mockLeasesService.getExpiringLeases.mockResolvedValue(mockLeases);

      const result = await controller.getExpiringLeases();

      expect(mockLeasesService.getExpiringLeases).toHaveBeenCalledWith(30);
      expect(result).toEqual(mockLeases);
    });

    it('should return expiring leases with custom days', async () => {
      const mockLeases = [mockLease];
      mockLeasesService.getExpiringLeases.mockResolvedValue(mockLeases);

      const result = await controller.getExpiringLeases('60');

      expect(mockLeasesService.getExpiringLeases).toHaveBeenCalledWith(60);
      expect(result).toEqual(mockLeases);
    });
  });

  describe('getLeaseById', () => {
    it('should return lease by id', async () => {
      mockValidationService.validate.mockReturnValue('lease-123');
      mockLeasesService.getLeaseById.mockResolvedValue(mockLease);

      const result = await controller.getLeaseById('lease-123');

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'lease-123',
      );
      expect(mockLeasesService.getLeaseById).toHaveBeenCalledWith('lease-123');
      expect(result).toEqual(mockLease);
    });

    it('should throw validation error for invalid id', async () => {
      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(controller.getLeaseById('invalid')).rejects.toThrow(
        'Invalid ID',
      );
    });
  });

  describe('updateLease', () => {
    it('should update lease successfully', async () => {
      const updateDto = {
        name: 'Updated Lease',
        status: 'expired',
      };

      mockValidationService.validate
        .mockReturnValueOnce('lease-123')
        .mockReturnValueOnce(updateDto);
      mockLeasesService.updateLease.mockResolvedValue({
        ...mockLease,
        ...updateDto,
      });

      const result = await controller.updateLease('lease-123', updateDto);

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'lease-123',
      );
      expect(mockValidationService.validate).toHaveBeenCalledWith(
        expect.any(Object),
        updateDto,
      );
      expect(mockLeasesService.updateLease).toHaveBeenCalledWith(
        'lease-123',
        updateDto,
      );
      expect(result).toEqual({ ...mockLease, ...updateDto });
    });

    it('should throw validation error for invalid id', async () => {
      const updateDto = { name: 'Updated Lease' };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(
        controller.updateLease('invalid', updateDto),
      ).rejects.toThrow('Invalid ID');
    });

    it('should throw validation error for invalid update data', async () => {
      const invalidDto = { name: '' };

      mockValidationService.validate
        .mockReturnValueOnce('lease-123')
        .mockImplementationOnce(() => {
          throw new Error('Invalid update data');
        });

      await expect(
        controller.updateLease('lease-123', invalidDto),
      ).rejects.toThrow('Invalid update data');
    });
  });

  describe('deleteLease', () => {
    it('should delete lease successfully', async () => {
      mockValidationService.validate.mockReturnValue('lease-123');
      mockLeasesService.deleteLease.mockResolvedValue({ success: true });

      const result = await controller.deleteLease('lease-123');

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'lease-123',
      );
      expect(mockLeasesService.deleteLease).toHaveBeenCalledWith('lease-123');
      expect(result).toEqual({ success: true });
    });

    it('should throw validation error for invalid id', async () => {
      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(controller.deleteLease('invalid')).rejects.toThrow(
        'Invalid ID',
      );
    });
  });
});
