import { Test, TestingModule } from '@nestjs/testing';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { ValidationService } from '../common/validation/validation.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import { AbilitiesFactory } from '../authorization/abilities.factory';

describe('ProductionController', () => {
  let controller: ProductionController;
  let mockProductionService: jest.Mocked<ProductionService>;
  let mockValidationService: jest.Mocked<ValidationService>;

  const mockProductionRecord = {
    id: 'prod-123',
    organizationId: 'org-123',
    wellId: 'well-123',
    productionDate: '2024-01-15',
    oilVolume: '100.50',
    gasVolume: '5000.25',
    waterVolume: '25.75',
    oilPrice: '75.50',
    gasPrice: '3.25',
    runTicket: 'RT-001',
    comments: 'Good production day',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockProductionService = {
      createProductionRecord: jest.fn(),
      getProductionRecordById: jest.fn(),
      getProductionRecordsByWell: jest.fn(),
      updateProductionRecord: jest.fn(),
      deleteProductionRecord: jest.fn(),
    } as any;

    mockValidationService = {
      validate: jest.fn(),
      schemas: {
        id: { parse: jest.fn() },
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductionController],
      providers: [
        {
          provide: ProductionService,
          useValue: mockProductionService,
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

    controller = module.get<ProductionController>(ProductionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProductionRecord', () => {
    it('should create a production record successfully', async () => {
      const createDto = {
        wellId: 'well-123',
        productionDate: '2024-01-15',
        oilVolume: '100.50',
        gasVolume: '5000.25',
        waterVolume: '25.75',
        notes: 'Good production day',
      };

      mockValidationService.validate.mockReturnValue(createDto);
      mockProductionService.createProductionRecord.mockResolvedValue(
        mockProductionRecord,
      );

      const result = await controller.createProductionRecord(createDto);

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        expect.any(Object),
        createDto,
      );
      expect(mockProductionService.createProductionRecord).toHaveBeenCalledWith(
        createDto,
      );
      expect(result).toEqual(mockProductionRecord);
    });

    it('should throw validation error for invalid data', async () => {
      const invalidDto = {
        wellId: 'invalid-uuid',
        productionDate: '',
      };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(
        controller.createProductionRecord(invalidDto),
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('getProductionRecordsByWell', () => {
    it('should return production records for a well', async () => {
      const mockRecords = [mockProductionRecord];
      mockValidationService.validate.mockReturnValue('well-123');
      mockProductionService.getProductionRecordsByWell.mockResolvedValue(
        mockRecords,
      );

      const result = await controller.getProductionRecordsByWell('well-123');

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'well-123',
      );
      expect(
        mockProductionService.getProductionRecordsByWell,
      ).toHaveBeenCalledWith('well-123');
      expect(result).toEqual(mockRecords);
    });

    it('should throw validation error for invalid well id', async () => {
      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid well ID');
      });

      await expect(
        controller.getProductionRecordsByWell('invalid'),
      ).rejects.toThrow('Invalid well ID');
    });
  });

  describe('getProductionRecordById', () => {
    it('should return production record by id', async () => {
      mockValidationService.validate.mockReturnValue('prod-123');
      mockProductionService.getProductionRecordById.mockResolvedValue(
        mockProductionRecord,
      );

      const result = await controller.getProductionRecordById('prod-123');

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'prod-123',
      );
      expect(
        mockProductionService.getProductionRecordById,
      ).toHaveBeenCalledWith('prod-123');
      expect(result).toEqual(mockProductionRecord);
    });

    it('should throw validation error for invalid id', async () => {
      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(
        controller.getProductionRecordById('invalid'),
      ).rejects.toThrow('Invalid ID');
    });
  });

  describe('updateProductionRecord', () => {
    it('should update production record successfully', async () => {
      const updateDto = {
        oilVolume: '150.00',
        gasVolume: '6000.00',
        notes: 'Updated production data',
      };

      mockValidationService.validate
        .mockReturnValueOnce('prod-123')
        .mockReturnValueOnce(updateDto);
      mockProductionService.updateProductionRecord.mockResolvedValue({
        ...mockProductionRecord,
        ...updateDto,
      });

      const result = await controller.updateProductionRecord(
        'prod-123',
        updateDto,
      );

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'prod-123',
      );
      expect(mockValidationService.validate).toHaveBeenCalledWith(
        expect.any(Object),
        updateDto,
      );
      expect(mockProductionService.updateProductionRecord).toHaveBeenCalledWith(
        'prod-123',
        updateDto,
      );
      expect(result).toEqual({ ...mockProductionRecord, ...updateDto });
    });

    it('should throw validation error for invalid id', async () => {
      const updateDto = { oilVolume: '150.00' };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(
        controller.updateProductionRecord('invalid', updateDto),
      ).rejects.toThrow('Invalid ID');
    });

    it('should throw validation error for invalid update data', async () => {
      const invalidDto = { oilVolume: 'invalid-number' };

      mockValidationService.validate
        .mockReturnValueOnce('prod-123')
        .mockImplementationOnce(() => {
          throw new Error('Invalid update data');
        });

      await expect(
        controller.updateProductionRecord('prod-123', invalidDto),
      ).rejects.toThrow('Invalid update data');
    });
  });

  describe('deleteProductionRecord', () => {
    it('should delete production record successfully', async () => {
      mockValidationService.validate.mockReturnValue('prod-123');
      mockProductionService.deleteProductionRecord.mockResolvedValue(
        mockProductionRecord,
      );

      const result = await controller.deleteProductionRecord('prod-123');

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'prod-123',
      );
      expect(mockProductionService.deleteProductionRecord).toHaveBeenCalledWith(
        'prod-123',
      );
      expect(result).toEqual(mockProductionRecord);
    });

    it('should throw validation error for invalid id', async () => {
      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(
        controller.deleteProductionRecord('invalid'),
      ).rejects.toThrow('Invalid ID');
    });
  });
});
