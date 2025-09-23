import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductionService } from './production.service';
import { DatabaseService } from '../database/database.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';

describe('ProductionService', () => {
  let service: ProductionService;
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
      orderBy: jest.fn().mockReturnThis(),
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
        ProductionService,
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

    service = module.get<ProductionService>(ProductionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProductionRecord', () => {
    it('should create a production record successfully', async () => {
      const dto = {
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.5',
        gasVolume: '500.2',
        waterVolume: '25.1',
        notes: 'Good production day',
      };

      const mockRecord = {
        id: 'prod-123',
        ...dto,
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.returning.mockResolvedValue([mockRecord]);

      const result = await service.createProductionRecord(dto);

      expect(mockDatabaseService.getDb).toHaveBeenCalled();
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
        ...dto,
        organizationId: 'org-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.returning.mockResolvedValue([mockRecord]);

      const result = await service.createProductionRecord(dto);

      expect(result).toEqual(mockRecord);
    });

    it('should throw error when production record creation fails', async () => {
      const dto = {
        wellId: 'well-123',
        productionDate: '2024-01-15',
      };

      mockDb.returning.mockResolvedValue([]);

      await expect(service.createProductionRecord(dto)).rejects.toThrow(
        'Failed to create production record',
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
        organizationId: 'org-123',
      };

      mockDb.limit.mockResolvedValue([mockRecord]);

      const result = await service.getProductionRecordById('prod-123');

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException when production record not found', async () => {
      mockDb.limit.mockResolvedValue([]);

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
          organizationId: 'org-123',
        },
        {
          id: 'prod-2',
          wellId: 'well-123',
          productionDate: '2024-01-14',
          oilVolume: '95.2',
          organizationId: 'org-123',
        },
      ];

      mockDb.orderBy.mockResolvedValue(mockRecords);

      const result = await service.getProductionRecordsByWell('well-123');

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(mockRecords);
    });

    it('should return empty array when no production records exist for well', async () => {
      mockDb.orderBy.mockResolvedValue([]);

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
        organizationId: 'org-123',
      };

      const updateDto = {
        oilVolume: '120.0',
        gasVolume: '550.0',
        notes: 'Updated production',
      };

      const updatedRecord = {
        ...existingRecord,
        ...updateDto,
        updatedAt: new Date(),
      };

      // Mock getProductionRecordById
      mockDb.limit.mockResolvedValueOnce([existingRecord]);
      // Mock update
      mockDb.returning.mockResolvedValue([updatedRecord]);

      const result = await service.updateProductionRecord(
        'prod-123',
        updateDto,
      );

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(updatedRecord);
    });

    it('should throw error when production record not found', async () => {
      // Mock getProductionRecordById to throw NotFoundException
      mockDb.limit.mockResolvedValue([]);

      await expect(
        service.updateProductionRecord('prod-123', { oilVolume: '120.0' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error when update fails', async () => {
      const existingRecord = {
        id: 'prod-123',
        wellId: 'well-123',
        productionDate: '2024-01-15',
        organizationId: 'org-123',
      };

      // Mock getProductionRecordById
      mockDb.limit.mockResolvedValueOnce([existingRecord]);
      // Mock update failure
      mockDb.returning.mockResolvedValue([]);

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
        organizationId: 'org-123',
      };

      // Mock getProductionRecordById
      mockDb.limit.mockResolvedValueOnce([existingRecord]);
      // Mock delete
      mockDb.returning.mockResolvedValue([existingRecord]);

      const result = await service.deleteProductionRecord('prod-123');

      expect(mockTenantContextService.getOrganizationId).toHaveBeenCalled();
      expect(result).toEqual(existingRecord);
    });

    it('should throw error when production record not found', async () => {
      // Mock getProductionRecordById to throw NotFoundException
      mockDb.limit.mockResolvedValue([]);

      await expect(service.deleteProductionRecord('prod-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw error when delete fails', async () => {
      const existingRecord = {
        id: 'prod-123',
        wellId: 'well-123',
        productionDate: '2024-01-15',
        organizationId: 'org-123',
      };

      // Mock getProductionRecordById
      mockDb.limit.mockResolvedValueOnce([existingRecord]);
      // Mock delete failure
      mockDb.returning.mockResolvedValue([]);

      await expect(service.deleteProductionRecord('prod-123')).rejects.toThrow(
        'Failed to delete production record',
      );
    });
  });
});
