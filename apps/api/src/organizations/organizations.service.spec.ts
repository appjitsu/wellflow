import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import {
  OrganizationRecord,
  OrganizationsRepository,
} from './domain/organizations.repository';
import { TenantContextService } from '../common/tenant/tenant-context.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationsRepository: jest.Mocked<OrganizationsRepository>;
  let mockTenantContextService: jest.Mocked<TenantContextService>;

  beforeEach(async () => {
    const mockOrganizationsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockTenantContextService = {
      getOrganizationId: jest.fn().mockReturnValue('org-123'),
      validateOrganizationAccess: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: 'OrganizationsRepository',
          useValue: mockOrganizationsRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationsRepository = module.get('OrganizationsRepository');
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
        name: 'Test Organization',
        taxId: null,
        address: null,
        phone: 'test@example.com',
        email: 'test@example.com',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      organizationsRepository.create.mockResolvedValue(mockOrg);

      const result = await service.createOrganization(dto);

      expect(organizationsRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockOrg);
    });

    it('should throw error when organization creation fails', async () => {
      const dto = {
        name: 'Test Organization',
      };

      organizationsRepository.create.mockResolvedValue(undefined as any);

      await expect(service.createOrganization(dto)).rejects.toThrow(
        'Failed to create organization',
      );
      expect(organizationsRepository.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('getOrganizationById', () => {
    it('should return organization when found', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Organization',
        taxId: null,
        address: null,
        phone: null,
        email: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      organizationsRepository.findById.mockResolvedValue(mockOrg);

      const result = await service.getOrganizationById('org-123');

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(organizationsRepository.findById).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException when organization not found', async () => {
      organizationsRepository.findById.mockResolvedValue(null);

      await expect(service.getOrganizationById('org-123')).rejects.toThrow(
        NotFoundException,
      );
      expect(organizationsRepository.findById).toHaveBeenCalledWith('org-123');
    });
  });

  describe('getCurrentOrganization', () => {
    it('should return current organization', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Current Organization',
        taxId: null,
        address: null,
        phone: null,
        email: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      organizationsRepository.findById.mockResolvedValue(mockOrg);

      const result = await service.getCurrentOrganization();

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(organizationsRepository.findById).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockOrg);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const existingOrg = {
        id: 'org-123',
        name: 'Old Name',
        taxId: null,
        address: null,
        phone: null,
        email: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updateDto = { name: 'New Name' };
      const updatedOrg = {
        ...existingOrg,
        ...updateDto,
        updatedAt: new Date(),
      };

      // Mock getOrganizationById
      organizationsRepository.findById.mockResolvedValue(existingOrg);
      // Mock update
      organizationsRepository.update.mockResolvedValue(updatedOrg);

      const result = await service.updateOrganization('org-123', updateDto);

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(organizationsRepository.findById).toHaveBeenCalledWith('org-123');
      expect(organizationsRepository.update).toHaveBeenCalledWith(
        'org-123',
        updateDto,
      );
      expect(result).toEqual(updatedOrg);
    });

    it('should throw error when update fails', async () => {
      const existingOrg = {
        id: 'org-123',
        name: 'Old Name',
        taxId: null,
        address: null,
        phone: null,
        email: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getOrganizationById
      organizationsRepository.findById.mockResolvedValue(existingOrg);
      // Mock update failure
      organizationsRepository.update.mockResolvedValue(undefined as any);

      await expect(
        service.updateOrganization('org-123', { name: 'New Name' }),
      ).rejects.toThrow('Failed to update organization');
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization successfully', async () => {
      const existingOrg = {
        id: 'org-123',
        name: 'Test Organization',
        taxId: null,
        address: null,
        phone: null,
        email: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getOrganizationById
      organizationsRepository.findById.mockResolvedValue(existingOrg);
      // Mock delete
      organizationsRepository.delete.mockResolvedValue(existingOrg);

      const result = await service.deleteOrganization('org-123');

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(organizationsRepository.findById).toHaveBeenCalledWith('org-123');
      expect(organizationsRepository.delete).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(existingOrg);
    });

    it('should throw error when delete fails', async () => {
      const existingOrg = {
        id: 'org-123',
        name: 'Test Organization',
        taxId: null,
        address: null,
        phone: null,
        email: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getOrganizationById
      organizationsRepository.findById.mockResolvedValue(existingOrg);
      // Mock delete failure
      organizationsRepository.delete.mockResolvedValue(undefined as any);

      await expect(service.deleteOrganization('org-123')).rejects.toThrow(
        'Failed to delete organization',
      );
    });
  });

  describe('getOrganizationStats', () => {
    it('should return organization stats', async () => {
      const mockOrg: OrganizationRecord = {
        id: 'org-123',
        name: 'Test Organization',
        taxId: null,
        address: null,
        phone: null,
        email: null,
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getOrganizationById via repository
      organizationsRepository.findById.mockResolvedValue(mockOrg);

      const result = await service.getOrganizationStats('org-123');

      expect(
        mockTenantContextService.validateOrganizationAccess,
      ).toHaveBeenCalledWith('org-123');
      expect(organizationsRepository.findById).toHaveBeenCalledWith('org-123');
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
