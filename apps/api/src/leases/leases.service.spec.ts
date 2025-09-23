import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { DatabaseService } from '../database/database.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';

describe('LeasesService', () => {
  let service: LeasesService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;
  let mockTenantContextService: jest.Mocked<TenantContextService>;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    } as any;

    mockTenantContextService = {
      getOrganizationId: jest.fn().mockReturnValue('org-123'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeasesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.returning.mockResolvedValue([mockLease]);

      const result = await service.createLease(dto);

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(mockLease);
    });

    it('should throw error when lease creation fails', async () => {
      const dto = {
        name: 'Test Lease',
        lessor: 'Test Lessor',
        lessee: 'Test Lessee',
      };

      mockDb.returning.mockResolvedValue([]);

      await expect(service.createLease(dto)).rejects.toThrow(
        'Failed to create lease',
      );
    });
  });

  describe('getLeaseById', () => {
    it('should return lease when found', async () => {
      const mockLease = {
        id: 'lease-123',
        name: 'Test Lease',
        organizationId: 'org-123',
      };

      mockDb.limit.mockResolvedValue([mockLease]);

      const result = await service.getLeaseById('lease-123');

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockLease);
    });

    it('should throw NotFoundException when lease not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.getLeaseById('lease-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLeases', () => {
    it('should return all leases for organization', async () => {
      const mockLeases = [
        { id: 'lease-1', name: 'Lease 1', organizationId: 'org-123' },
        { id: 'lease-2', name: 'Lease 2', organizationId: 'org-123' },
      ];

      mockDb.where.mockResolvedValue(mockLeases);

      const result = await service.getLeases();

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockLeases);
    });
  });

  describe('updateLease', () => {
    it('should update lease successfully', async () => {
      const existingLease = {
        id: 'lease-123',
        name: 'Old Name',
        organizationId: 'org-123',
      };
      const updateDto = { name: 'New Name' };
      const updatedLease = {
        ...existingLease,
        ...updateDto,
        updatedAt: new Date(),
      };

      // Mock getLeaseById
      mockDb.limit.mockResolvedValueOnce([existingLease]);
      // Mock update
      mockDb.returning.mockResolvedValue([updatedLease]);

      const result = await service.updateLease('lease-123', updateDto);

      expect(result).toEqual(updatedLease);
    });

    it('should throw error when update fails', async () => {
      const existingLease = {
        id: 'lease-123',
        name: 'Old Name',
        organizationId: 'org-123',
      };

      // Mock getLeaseById
      mockDb.limit.mockResolvedValueOnce([existingLease]);
      // Mock update failure
      mockDb.returning.mockResolvedValue([]);

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
      };

      // Mock getLeaseById
      mockDb.limit.mockResolvedValueOnce([existingLease]);
      // Mock delete
      mockDb.returning.mockResolvedValue([existingLease]);

      const result = await service.deleteLease('lease-123');

      expect(result).toEqual(existingLease);
    });

    it('should throw error when delete fails', async () => {
      const existingLease = {
        id: 'lease-123',
        name: 'Test Lease',
        organizationId: 'org-123',
      };

      // Mock getLeaseById
      mockDb.limit.mockResolvedValueOnce([existingLease]);
      // Mock delete failure
      mockDb.returning.mockResolvedValue([]);

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
        },
      ];

      mockDb.where.mockResolvedValue(mockLeases);

      const result = await service.getLeasesByStatus('active');

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
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
        },
      ];

      mockDb.where.mockResolvedValue(mockLeases);

      const result = await service.getExpiringLeases(30);

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockLeases);
    });
  });
});
