import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductionService } from '../production.service';
import type { ProductionRepository } from '../../domain/repositories/production.repository.interface';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

describe('ProductionService', () => {
  let service: ProductionService;
  let mockProductionRepository: jest.Mocked<ProductionRepository>;
  let mockTenantContextService: jest.Mocked<TenantContextService>;

  beforeEach(async () => {
    mockProductionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByWellId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockTenantContextService = {
      getOrganizationId: jest.fn().mockReturnValue('org-123'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: 'ProductionRepository',
          useValue: mockProductionRepository,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    service = module.get<ProductionService>(ProductionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProductionRecord', () => {
    it('should create production record successfully', async () => {
      const dto = {
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.5',
        gasVolume: '500.2',
        waterVolume: '25.1',
        oilPrice: '60.50',
        gasPrice: '3.25',
        runTicket: 'RT-001',
        comments: 'Good production day',
      };

      const mockRecord = {
        id: 'prod-123',
        ...dto,
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductionRepository.create.mockResolvedValue(mockRecord);

      const result = await service.createProductionRecord(dto);

      expect(mockProductionRepository.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: 'org-123',
      });
      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockRecord);
    });

    it('should create production record with minimal data', async () => {
      const dto = {
        wellId: 'well-456',
        productionDate: '2024-01-16',
      };

      const mockRecord = {
        id: 'prod-456',
        wellId: 'well-456',
        productionDate: '2024-01-16',
        organizationId: 'org-123',
        oilVolume: null,
        gasVolume: null,
        waterVolume: null,
        oilPrice: null,
        gasPrice: null,
        runTicket: null,
        comments: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductionRepository.create.mockResolvedValue(mockRecord);

      const result = await service.createProductionRecord(dto);

      expect(result).toEqual(mockRecord);
    });

    it('should throw error when production record creation fails', async () => {
      const dto = {
        wellId: 'well-123',
        productionDate: '2024-01-15',
        organizationId: 'org-123',
      };

      mockProductionRepository.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.createProductionRecord(dto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getProductionRecordById', () => {
    it('should return production record when found', async () => {
      const mockRecord = {
        id: 'prod-123',
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.5',
        gasVolume: '500.2',
        waterVolume: '25.1',
        oilPrice: '60.50',
        gasPrice: '3.25',
        runTicket: 'RT-001',
        comments: 'Good production day',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProductionRepository.findById.mockResolvedValue(mockRecord);

      const result = await service.getProductionRecordById('prod-123');

      expect(mockProductionRepository.findById).toHaveBeenCalledWith(
        'prod-123',
      );
      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException when production record not found', async () => {
      mockProductionRepository.findById.mockResolvedValue(null);

      await expect(service.getProductionRecordById('prod-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProductionRecordsByWell', () => {
    it('should return production records for a well', async () => {
      const mockRecords = [
        {
          id: 'prod-1',
          wellId: 'well-123',
          productionDate: '2024-01-15',
          oilVolume: '100.5',
          gasVolume: '500.2',
          waterVolume: '25.1',
          oilPrice: '60.50',
          gasPrice: '3.25',
          runTicket: 'RT-001',
          comments: 'Good production day',
          organizationId: 'org-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'prod-2',
          wellId: 'well-123',
          productionDate: '2024-01-14',
          oilVolume: '95.2',
          gasVolume: '480.1',
          waterVolume: '22.3',
          oilPrice: '61.00',
          gasPrice: '3.30',
          runTicket: 'RT-002',
          comments: 'Another good day',
          organizationId: 'org-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockProductionRepository.findByWellId.mockResolvedValue(mockRecords);

      const result = await service.getProductionRecordsByWell('well-123');

      expect(mockProductionRepository.findByWellId).toHaveBeenCalledWith(
        'well-123',
      );
      expect(result).toEqual(mockRecords);
    });

    it('should return empty array when no production records exist for well', async () => {
      mockProductionRepository.findByWellId.mockResolvedValue([]);

      const result = await service.getProductionRecordsByWell('well-123');

      expect(result).toEqual([]);
    });
  });

  describe('updateProductionRecord', () => {
    it('should update production record successfully', async () => {
      const existingRecord = {
        id: 'prod-123',
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.5',
        gasVolume: '500.2',
        waterVolume: '25.1',
        oilPrice: '60.50',
        gasPrice: '3.25',
        runTicket: 'RT-001',
        comments: 'Good production day',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto = {
        oilVolume: '120.0',
        gasVolume: '550.0',
        waterVolume: '30.0',
        oilPrice: '62.00',
        gasPrice: '3.40',
        runTicket: 'RT-001-UPD',
        comments: 'Updated production',
      };

      const updatedRecord = {
        ...existingRecord,
        ...updateDto,
        updatedAt: new Date(),
      };

      // Mock getProductionRecordById
      mockProductionRepository.findById.mockResolvedValue(existingRecord);
      // Mock update
      mockProductionRepository.update.mockResolvedValue(updatedRecord);

      const result = await service.updateProductionRecord(
        'prod-123',
        updateDto,
      );

      expect(mockProductionRepository.findById).toHaveBeenCalledWith(
        'prod-123',
      );
      expect(mockProductionRepository.update).toHaveBeenCalledWith(
        'prod-123',
        updateDto,
      );
      expect(result).toEqual(updatedRecord);
    });

    it('should throw error when production record not found', async () => {
      // Mock getProductionRecordById to throw NotFoundException
      mockProductionRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateProductionRecord('prod-123', { oilVolume: '120.0' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when update fails', async () => {
      const existingRecord = {
        id: 'prod-123',
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.5',
        gasVolume: '500.2',
        waterVolume: '25.1',
        oilPrice: '60.50',
        gasPrice: '3.25',
        runTicket: 'RT-001',
        comments: 'Good production day',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getProductionRecordById
      mockProductionRepository.findById.mockResolvedValue(existingRecord);
      // Mock update failure
      mockProductionRepository.update.mockResolvedValue(null);

      await expect(
        service.updateProductionRecord('prod-123', { oilVolume: '120.0' }),
      ).rejects.toThrow('Failed to update production record');
    });
  });

  describe('deleteProductionRecord', () => {
    it('should delete production record successfully', async () => {
      const existingRecord = {
        id: 'prod-123',
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.5',
        gasVolume: '500.2',
        waterVolume: '25.1',
        oilPrice: '60.50',
        gasPrice: '3.25',
        runTicket: 'RT-001',
        comments: 'Good production day',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getProductionRecordById
      mockProductionRepository.findById.mockResolvedValue(existingRecord);
      // Mock delete
      mockProductionRepository.delete.mockResolvedValue(true);

      const result = await service.deleteProductionRecord('prod-123');

      expect(mockProductionRepository.findById).toHaveBeenCalledWith(
        'prod-123',
      );
      expect(mockProductionRepository.delete).toHaveBeenCalledWith('prod-123');
      expect(result).toEqual({ success: true });
    });

    it('should throw error when production record not found', async () => {
      // Mock getProductionRecordById to throw NotFoundException
      mockProductionRepository.findById.mockResolvedValue(null);

      await expect(service.deleteProductionRecord('prod-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when delete fails', async () => {
      const existingRecord = {
        id: 'prod-123',
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.5',
        gasVolume: '500.2',
        waterVolume: '25.1',
        oilPrice: '60.50',
        gasPrice: '3.25',
        runTicket: 'RT-001',
        comments: 'Good production day',
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getProductionRecordById
      mockProductionRepository.findById.mockResolvedValue(existingRecord);
      // Mock delete failure
      mockProductionRepository.delete.mockResolvedValue(false);

      await expect(service.deleteProductionRecord('prod-123')).rejects.toThrow(
        'Failed to delete production record',
      );
    });
  });
});
