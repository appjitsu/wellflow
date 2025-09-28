import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeasesService } from '../leases.service';
import type { LeaseRepository } from '../domain/repositories/lease.repository.interface';
import { TenantContextService } from '../common/tenant/tenant-context.service';

describe('LeasesService', () => {
  let service: LeasesService;
  let mockLeaseRepository: jest.Mocked<LeaseRepository>;
  let mockTenantContextService: jest.Mocked<TenantContextService>;

  beforeEach(async () => {
    mockLeaseRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByStatus: jest.fn(),
      findExpiring: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockTenantContextService = {
      getOrganizationId: jest.fn().mockReturnValue('org-123'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeasesService,
        {
          provide: 'LeaseRepository',
          useValue: mockLeaseRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    service = module.get<LeasesService>(LeasesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLease', () => {
    it('should create a lease successfully', async () => {
      const dto = {
        name: 'Test Lease',
        lessor: 'Test Lessor',
        lessee: 'Test Lessee',
      };

      const mockLease = {
        id: 'lease-123',
        ...dto,
        organizationId: 'org-123',
        leaseNumber: null,
        acreage: null,
        royaltyRate: null,
        effectiveDate: null,
        expirationDate: null,
        status: 'active',
        legalDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeaseRepository.create.mockResolvedValue(mockLease);

      const result = await service.createLease(dto);

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(mockLeaseRepository.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: 'org-123',
      });
      expect(result).toEqual(mockLease);
    });

    it('should throw error when lease creation fails', async () => {
      const dto = {
        name: 'Test Lease',
        lessor: 'Test Lessor',
        lessee: 'Test Lessee',
      };

      mockLeaseRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.createLease(dto)).rejects.toThrow('Database error');
    });
  });

  describe('getLeaseById', () => {
    it('should return lease when found', async () => {
      const mockLease = {
        id: 'lease-123',
        name: 'Test Lease',
        organizationId: 'org-123',
        leaseNumber: null,
        lessor: 'Test Lessor',
        lessee: 'Test Lessee',
        acreage: null,
        royaltyRate: null,
        effectiveDate: null,
        expirationDate: null,
        status: 'active',
        legalDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeaseRepository.findById.mockResolvedValue(mockLease);

      const result = await service.getLeaseById('lease-123');

      expect(mockLeaseRepository.findById).toHaveBeenCalledWith('lease-123');
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockLease);
    });

    it('should throw NotFoundException when lease not found', async () => {
      mockLeaseRepository.findById.mockResolvedValue(null);

      await expect(service.getLeaseById('lease-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when lease belongs to different organization', async () => {
      const mockLease = {
        id: 'lease-123',
        name: 'Test Lease',
        organizationId: 'different-org',
        leaseNumber: null,
        lessor: 'Test Lessor',
        lessee: 'Test Lessee',
        acreage: null,
        royaltyRate: null,
        effectiveDate: null,
        expirationDate: null,
        status: 'active',
        legalDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeaseRepository.findById.mockResolvedValue(mockLease);

      await expect(service.getLeaseById('lease-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLeases', () => {
    it('should return all leases for organization', async () => {
      const mockLeases = [
        {
          id: 'lease-1',
          name: 'Lease 1',
          organizationId: 'org-123',
          leaseNumber: null,
          lessor: 'Lessor 1',
          lessee: 'Lessee 1',
          acreage: null,
          royaltyRate: null,
          effectiveDate: null,
          expirationDate: null,
          status: 'active',
          legalDescription: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'lease-2',
          name: 'Lease 2',
          organizationId: 'org-123',
          leaseNumber: null,
          lessor: 'Lessor 2',
          lessee: 'Lessee 2',
          acreage: null,
          royaltyRate: null,
          effectiveDate: null,
          expirationDate: null,
          status: 'active',
          legalDescription: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockLeaseRepository.findAll.mockResolvedValue(mockLeases);

      const result = await service.getLeases();

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(mockLeaseRepository.findAll).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockLeases);
    });
  });

  describe('updateLease', () => {
    it('should update lease successfully', async () => {
      const existingLease = {
        id: 'lease-123',
        name: 'Old Name',
        organizationId: 'org-123',
        leaseNumber: null,
        lessor: 'Lessor 1',
        lessee: 'Lessee 1',
        acreage: null,
        royaltyRate: null,
        effectiveDate: null,
        expirationDate: null,
        status: 'active',
        legalDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updateDto = { name: 'New Name' };
      const updatedLease = {
        ...existingLease,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockLeaseRepository.findById.mockResolvedValue(existingLease);
      mockLeaseRepository.update.mockResolvedValue(updatedLease);

      const result = await service.updateLease('lease-123', updateDto);

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(mockLeaseRepository.findById).toHaveBeenCalledWith('lease-123');
      expect(mockLeaseRepository.update).toHaveBeenCalledWith(
        'lease-123',
        updateDto,
      );
      expect(result).toEqual(updatedLease);
    });

    it('should throw error when update fails', async () => {
      const existingLease = {
        id: 'lease-123',
        name: 'Old Name',
        organizationId: 'org-123',
        leaseNumber: null,
        lessor: 'Lessor 1',
        lessee: 'Lessee 1',
        acreage: null,
        royaltyRate: null,
        effectiveDate: null,
        expirationDate: null,
        status: 'active',
        legalDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeaseRepository.findById.mockResolvedValue(existingLease);
      mockLeaseRepository.update.mockResolvedValue(null);

      await expect(
        service.updateLease('lease-123', { name: 'New Name' }),
      ).rejects.toThrow('Failed to update lease');
    });
  });

  describe('deleteLease', () => {
    it('should delete lease successfully', async () => {
      const existingLease = {
        id: 'lease-123',
        name: 'Test Lease',
        organizationId: 'org-123',
        leaseNumber: null,
        lessor: 'Lessor 1',
        lessee: 'Lessee 1',
        acreage: null,
        royaltyRate: null,
        effectiveDate: null,
        expirationDate: null,
        status: 'active',
        legalDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeaseRepository.findById.mockResolvedValue(existingLease);
      mockLeaseRepository.delete.mockResolvedValue(true);

      const result = await service.deleteLease('lease-123');

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(mockLeaseRepository.findById).toHaveBeenCalledWith('lease-123');
      expect(mockLeaseRepository.delete).toHaveBeenCalledWith('lease-123');
      expect(result).toEqual({ success: true });
    });

    it('should throw error when delete fails', async () => {
      const existingLease = {
        id: 'lease-123',
        name: 'Test Lease',
        organizationId: 'org-123',
        leaseNumber: null,
        lessor: 'Lessor 1',
        lessee: 'Lessee 1',
        acreage: null,
        royaltyRate: null,
        effectiveDate: null,
        expirationDate: null,
        status: 'active',
        legalDescription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeaseRepository.findById.mockResolvedValue(existingLease);
      mockLeaseRepository.delete.mockResolvedValue(false);

      await expect(service.deleteLease('lease-123')).rejects.toThrow(
        'Failed to delete lease',
      );
    });
  });

  describe('getLeasesByStatus', () => {
    it('should return leases by status', async () => {
      const mockLeases = [
        {
          id: 'lease-1',
          name: 'Lease 1',
          status: 'active',
          organizationId: 'org-123',
          leaseNumber: null,
          lessor: 'Lessor 1',
          lessee: 'Lessee 1',
          acreage: null,
          royaltyRate: null,
          effectiveDate: null,
          expirationDate: null,
          legalDescription: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockLeaseRepository.findByStatus.mockResolvedValue(mockLeases);

      const result = await service.getLeasesByStatus('active');

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(mockLeaseRepository.findByStatus).toHaveBeenCalledWith(
        'org-123',
        'active',
      );
      expect(result).toEqual(mockLeases);
    });
  });

  describe('getExpiringLeases', () => {
    it('should return expiring leases', async () => {
      const mockLeases = [
        {
          id: 'lease-1',
          name: 'Lease 1',
          status: 'active',
          organizationId: 'org-123',
          leaseNumber: null,
          lessor: 'Lessor 1',
          lessee: 'Lessee 1',
          acreage: null,
          royaltyRate: null,
          effectiveDate: null,
          expirationDate: new Date(
            Date.now() + 15 * 24 * 60 * 60 * 1000,
          ).toISOString(), // 15 days from now
          legalDescription: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockLeaseRepository.findExpiring.mockResolvedValue(mockLeases);

      const result = await service.getExpiringLeases(30);

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(mockLeaseRepository.findExpiring).toHaveBeenCalledWith(
        'org-123',
        30,
      );
      expect(result).toEqual(mockLeases);
    });
  });
});
