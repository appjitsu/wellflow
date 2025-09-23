import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { DatabaseService } from '../database/database.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
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
      validateOrganizationAccess: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
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

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrganization', () => {
    it('should create an organization successfully', async () => {
      const dto = {
        name: 'Test Organization',
        description: 'Test Description',
        contactEmail: 'test@example.com',
      };

      const mockOrg = {
        id: 'org-123',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.returning.mockResolvedValue([mockOrg]);

      const result = await service.createOrganization(dto);

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(result).toEqual(mockOrg);
    });

    it('should throw error when organization creation fails', async () => {
      const dto = {
        name: 'Test Organization',
      };

      mockDb.returning.mockResolvedValue([]);

      await expect(service.createOrganization(dto)).rejects.toThrow(
        'Failed to create organization',
      );
    });
  });

  describe('getOrganizationById', () => {
    it('should return organization when found', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Organization',
      };

      mockDb.limit.mockResolvedValue([mockOrg]);

      const result = await service.getOrganizationById('org-123');

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException when organization not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.getOrganizationById('org-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCurrentOrganization', () => {
    it('should return current organization', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Current Organization',
      };

      mockDb.limit.mockResolvedValue([mockOrg]);

      const result = await service.getCurrentOrganization();

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockOrg);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const existingOrg = { id: 'org-123', name: 'Old Name' };
      const updateDto = { name: 'New Name' };
      const updatedOrg = {
        ...existingOrg,
        ...updateDto,
        updatedAt: new Date(),
      };

      // Mock getOrganizationById
      mockDb.limit.mockResolvedValueOnce([existingOrg]);
      // Mock update
      mockDb.returning.mockResolvedValue([updatedOrg]);

      const result = await service.updateOrganization('org-123', updateDto);

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(updatedOrg);
    });

    it('should throw error when update fails', async () => {
      const existingOrg = { id: 'org-123', name: 'Old Name' };

      // Mock getOrganizationById
      mockDb.limit.mockResolvedValueOnce([existingOrg]);
      // Mock update failure
      mockDb.returning.mockResolvedValue([]);

      await expect(
        service.updateOrganization('org-123', { name: 'New Name' }),
      ).rejects.toThrow('Failed to update organization');
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization successfully', async () => {
      const existingOrg = { id: 'org-123', name: 'Test Organization' };

      // Mock getOrganizationById
      mockDb.limit.mockResolvedValueOnce([existingOrg]);
      // Mock delete
      mockDb.returning.mockResolvedValue([existingOrg]);

      const result = await service.deleteOrganization('org-123');

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(existingOrg);
    });

    it('should throw error when delete fails', async () => {
      const existingOrg = { id: 'org-123', name: 'Test Organization' };

      // Mock getOrganizationById
      mockDb.limit.mockResolvedValueOnce([existingOrg]);
      // Mock delete failure
      mockDb.returning.mockResolvedValue([]);

      await expect(service.deleteOrganization('org-123')).rejects.toThrow(
        'Failed to delete organization',
      );
    });
  });

  describe('getOrganizationStats', () => {
    it('should return organization stats', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Organization',
      };

      mockDb.limit.mockResolvedValue([mockOrg]);

      const result = await service.getOrganizationStats('org-123');

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(result).toEqual({
        organization: mockOrg,
        stats: {
          totalWells: 0,
          totalUsers: 0,
          totalProductionRecords: 0,
        },
      });
    });
  });
});
