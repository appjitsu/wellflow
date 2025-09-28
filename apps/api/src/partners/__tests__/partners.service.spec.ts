import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PartnersService } from '../partners.service';
import { PartnersRepository } from '../domain/partners.repository';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

describe('PartnersService', () => {
  let service: PartnersService;
  let mockPartnersRepository: jest.Mocked<PartnersRepository>;
  let mockTenantContextService: jest.Mocked<TenantContextService>;

  const createMockPartner = (overrides: Partial<any> = {}): any => ({
    id: 'partner-123',
    organizationId: 'org-123',
    partnerName: 'Test Partner',
    partnerCode: 'TP001',
    taxId: '123456789',
    billingAddress: null,
    remitAddress: null,
    contactEmail: 'test@partner.com',
    contactPhone: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockPartnersRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockTenantContextService = {
      getOrganizationId: jest.fn().mockReturnValue('org-123'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnersService,
        {
          provide: 'PartnersRepository',
          useValue: mockPartnersRepository,
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

      const mockPartner = createMockPartner({
        ...dto,
        id: 'partner-123',
      });

      mockPartnersRepository.create.mockResolvedValue(mockPartner);

      const result = await service.createPartner(dto);

      expect(mockPartnersRepository.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: 'org-123',
      });
      expect(result).toEqual(mockPartner);
    });

    it('should create partner with minimal data', async () => {
      const dto = {
        partnerName: 'Minimal Partner',
        partnerCode: 'MP001',
      };

      const mockPartner = createMockPartner({
        ...dto,
        id: 'partner-456',
        taxId: null,
        contactEmail: null,
        isActive: true,
      });

      mockPartnersRepository.create.mockResolvedValue(mockPartner);

      const result = await service.createPartner(dto);

      expect(mockPartnersRepository.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: 'org-123',
      });
      expect(result).toEqual(mockPartner);
    });

    it('should throw error when partner creation fails', async () => {
      const dto = {
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
      };

      mockPartnersRepository.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.createPartner(dto)).rejects.toThrow(
        'Failed to create partner',
      );
    });
  });

  describe('getPartnerById', () => {
    it('should return partner when found', async () => {
      const mockPartner = createMockPartner({
        id: 'partner-123',
      });

      mockPartnersRepository.findById.mockResolvedValue(mockPartner);

      const result = await service.getPartnerById('partner-123');

      expect(mockPartnersRepository.findById).toHaveBeenCalledWith(
        'partner-123',
        'org-123',
      );
      expect(result).toEqual(mockPartner);
    });

    it('should throw NotFoundException when partner not found', async () => {
      mockPartnersRepository.findById.mockResolvedValue(null);

      await expect(service.getPartnerById('partner-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getPartners', () => {
    it('should return all partners for organization', async () => {
      const mockPartners = [
        createMockPartner({
          id: 'partner-1',
          partnerName: 'Partner 1',
          partnerCode: 'P001',
        }),
        createMockPartner({
          id: 'partner-2',
          partnerName: 'Partner 2',
          partnerCode: 'P002',
        }),
      ];

      mockPartnersRepository.findAll.mockResolvedValue(mockPartners);

      const result = await service.getPartners();

      expect(mockPartnersRepository.findAll).toHaveBeenCalledWith('org-123');
      expect(result).toEqual(mockPartners);
    });

    it('should return empty array when no partners exist', async () => {
      mockPartnersRepository.findAll.mockResolvedValue([]);

      const result = await service.getPartners();

      expect(result).toEqual([]);
    });
  });

  describe('updatePartner', () => {
    it('should update partner successfully', async () => {
      const existingPartner = createMockPartner({
        id: 'partner-123',
        partnerName: 'Old Name',
        partnerCode: 'OLD001',
      });

      const updateDto = {
        partnerName: 'New Name',
        contactEmail: 'new@email.com',
      };

      const updatedPartner = createMockPartner({
        ...existingPartner,
        ...updateDto,
        updatedAt: new Date(),
      });

      mockPartnersRepository.findById.mockResolvedValue(existingPartner);
      mockPartnersRepository.update.mockResolvedValue(updatedPartner);

      const result = await service.updatePartner('partner-123', updateDto);

      expect(mockPartnersRepository.findById).toHaveBeenCalledWith(
        'partner-123',
        'org-123',
      );
      expect(mockPartnersRepository.update).toHaveBeenCalledWith(
        'partner-123',
        updateDto,
        'org-123',
      );
      expect(result).toEqual(updatedPartner);
    });

    it('should throw error when partner not found', async () => {
      mockPartnersRepository.findById.mockResolvedValue(null);

      await expect(
        service.updatePartner('partner-123', { partnerName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when update fails', async () => {
      const existingPartner = createMockPartner({
        id: 'partner-123',
      });

      mockPartnersRepository.findById.mockResolvedValue(existingPartner);
      mockPartnersRepository.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updatePartner('partner-123', { partnerName: 'New Name' }),
      ).rejects.toThrow('Failed to update partner');
    });
  });

  describe('deletePartner', () => {
    it('should delete partner successfully', async () => {
      const existingPartner = createMockPartner({
        id: 'partner-123',
      });

      mockPartnersRepository.findById.mockResolvedValue(existingPartner);
      mockPartnersRepository.delete.mockResolvedValue(true);

      const result = await service.deletePartner('partner-123');

      expect(mockPartnersRepository.findById).toHaveBeenCalledWith(
        'partner-123',
        'org-123',
      );
      expect(mockPartnersRepository.delete).toHaveBeenCalledWith(
        'partner-123',
        'org-123',
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw error when partner not found', async () => {
      mockPartnersRepository.findById.mockResolvedValue(null);

      await expect(service.deletePartner('partner-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when delete fails', async () => {
      const existingPartner = createMockPartner({
        id: 'partner-123',
      });

      mockPartnersRepository.findById.mockResolvedValue(existingPartner);
      mockPartnersRepository.delete.mockResolvedValue(false);

      await expect(service.deletePartner('partner-123')).rejects.toThrow(
        'Failed to delete partner',
      );
    });
  });
});
