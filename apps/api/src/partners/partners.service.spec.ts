import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { DatabaseService } from '../database/database.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';

describe('PartnersService', () => {
  let service: PartnersService;
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
        PartnersService,
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

    service = module.get<PartnersService>(PartnersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPartner', () => {
    it('should create a partner successfully', async () => {
      const dto = {
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
        taxId: '123456789',
        contactEmail: 'test@partner.com',
        isActive: true,
      };

      const mockPartner = {
        id: 'partner-123',
        ...dto,
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.returning.mockResolvedValue([mockPartner]);

      const result = await service.createPartner(dto);

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockPartner);
    });

    it('should create partner with minimal data', async () => {
      const dto = {
        partnerName: 'Minimal Partner',
        partnerCode: 'MP001',
      };

      const mockPartner = {
        id: 'partner-456',
        ...dto,
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.returning.mockResolvedValue([mockPartner]);

      const result = await service.createPartner(dto);

      expect(result).toEqual(mockPartner);
    });

    it('should throw error when partner creation fails', async () => {
      const dto = {
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
      };

      mockDb.returning.mockResolvedValue([]);

      await expect(service.createPartner(dto)).rejects.toThrow(
        'Failed to create partner',
      );
    });
  });

  describe('getPartnerById', () => {
    it('should return partner when found', async () => {
      const mockPartner = {
        id: 'partner-123',
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
        organizationId: 'org-123',
      };

      mockDb.limit.mockResolvedValue([mockPartner]);

      const result = await service.getPartnerById('partner-123');

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockPartner);
    });

    it('should throw NotFoundException when partner not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      await expect(service.getPartnerById('partner-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPartners', () => {
    it('should return all partners for organization', async () => {
      const mockPartners = [
        {
          id: 'partner-1',
          partnerName: 'Partner 1',
          partnerCode: 'P001',
          organizationId: 'org-123',
        },
        {
          id: 'partner-2',
          partnerName: 'Partner 2',
          partnerCode: 'P002',
          organizationId: 'org-123',
        },
      ];

      mockDb.where.mockResolvedValue(mockPartners);

      const result = await service.getPartners();

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockPartners);
    });

    it('should return empty array when no partners exist', async () => {
      mockDb.where.mockResolvedValue([]);

      const result = await service.getPartners();

      expect(result).toEqual([]);
    });
  });

  describe('updatePartner', () => {
    it('should update partner successfully', async () => {
      const existingPartner = {
        id: 'partner-123',
        partnerName: 'Old Name',
        partnerCode: 'OLD001',
        organizationId: 'org-123',
      };

      const updateDto = {
        partnerName: 'New Name',
        contactEmail: 'new@email.com',
      };

      const updatedPartner = {
        ...existingPartner,
        ...updateDto,
        updatedAt: new Date(),
      };

      // Mock getPartnerById
      mockDb.limit.mockResolvedValueOnce([existingPartner]);
      // Mock update
      mockDb.returning.mockResolvedValue([updatedPartner]);

      const result = await service.updatePartner('partner-123', updateDto);

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(updatedPartner);
    });

    it('should throw error when partner not found', async () => {
      // Mock getPartnerById to throw NotFoundException
      mockDb.limit.mockResolvedValue([]);

      await expect(
        service.updatePartner('partner-123', { partnerName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when update fails', async () => {
      const existingPartner = {
        id: 'partner-123',
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
        organizationId: 'org-123',
      };

      // Mock getPartnerById
      mockDb.limit.mockResolvedValueOnce([existingPartner]);
      // Mock update failure
      mockDb.returning.mockResolvedValue([]);

      await expect(
        service.updatePartner('partner-123', { partnerName: 'New Name' }),
      ).rejects.toThrow('Failed to update partner');
    });
  });

  describe('deletePartner', () => {
    it('should delete partner successfully', async () => {
      const existingPartner = {
        id: 'partner-123',
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
        organizationId: 'org-123',
      };

      // Mock getPartnerById
      mockDb.limit.mockResolvedValueOnce([existingPartner]);
      // Mock delete
      mockDb.returning.mockResolvedValue([existingPartner]);

      const result = await service.deletePartner('partner-123');

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(existingPartner);
    });

    it('should throw error when partner not found', async () => {
      // Mock getPartnerById to throw NotFoundException
      mockDb.limit.mockResolvedValue([]);

      await expect(service.deletePartner('partner-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when delete fails', async () => {
      const existingPartner = {
        id: 'partner-123',
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
        organizationId: 'org-123',
      };

      // Mock getPartnerById
      mockDb.limit.mockResolvedValueOnce([existingPartner]);
      // Mock delete failure
      mockDb.returning.mockResolvedValue([]);

      await expect(service.deletePartner('partner-123')).rejects.toThrow(
        'Failed to delete partner',
      );
    });
  });
});
