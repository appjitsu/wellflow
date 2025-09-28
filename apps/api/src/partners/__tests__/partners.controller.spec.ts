import { Test, TestingModule } from '@nestjs/testing';
import { PartnersController } from '../partners.controller';
import { PartnersService } from '../partners.service';
import { ValidationService } from '../common/validation/validation.service';
import { TenantGuard } from '../common/tenant/tenant.guard';
import { AbilitiesGuard } from '../authorization/abilities.guard';
import { AbilitiesFactory } from '../authorization/abilities.factory';

describe('PartnersController', () => {
  let controller: PartnersController;
  let mockPartnersService: jest.Mocked<PartnersService>;
  let mockValidationService: jest.Mocked<ValidationService>;

  const mockPartner = {
    id: 'partner-123',
    organizationId: 'org-123',
    partnerName: 'Test Partner',
    partnerCode: 'TP-001',
    taxId: '123456789',
    billingAddress: {
      street: '123 Main St',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      country: 'USA',
    },
    remitAddress: {
      street: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      country: 'USA',
    },
    contactEmail: 'contact@testpartner.com',
    contactPhone: '+1-555-0123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockPartnersService = {
      createPartner: jest.fn(),
      getPartnerById: jest.fn(),
      getPartners: jest.fn(),
      updatePartner: jest.fn(),
      deletePartner: jest.fn(),
    } as any;

    mockValidationService = {
      validate: jest.fn(),
      schemas: {
        id: { parse: jest.fn() },
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartnersController],
      providers: [
        {
          provide: PartnersService,
          useValue: mockPartnersService,
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

    controller = module.get<PartnersController>(PartnersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPartner', () => {
    it('should create a partner successfully', async () => {
      const createDto = {
        partnerName: 'Test Partner',
        partnerCode: 'TP-001',
        taxId: '123456789',
        billingAddress: {
          street: '123 Main St',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001',
          country: 'USA',
        },
        remitAddress: {
          street: '456 Oak Ave',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'USA',
        },
        contactEmail: 'contact@testpartner.com',
        contactPhone: '+1-555-0123',
        isActive: true,
      };

      mockValidationService.validate.mockReturnValue(createDto);
      mockPartnersService.createPartner.mockResolvedValue(mockPartner);

      const result = await controller.createPartner(createDto);

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        expect.any(Object),
        createDto,
      );
      expect(mockPartnersService.createPartner).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockPartner);
    });

    it('should throw validation error for invalid data', async () => {
      const invalidDto = {
        partnerName: '',
        partnerCode: '',
      };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(controller.createPartner(invalidDto)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('getPartnerById', () => {
    it('should return partner by id', async () => {
      mockValidationService.validate.mockReturnValue('partner-123');
      mockPartnersService.getPartnerById.mockResolvedValue(mockPartner);

      const result = await controller.getPartnerById('partner-123');

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'partner-123',
      );
      expect(mockPartnersService.getPartnerById).toHaveBeenCalledWith(
        'partner-123',
      );
      expect(result).toEqual(mockPartner);
    });

    it('should throw validation error for invalid id', async () => {
      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(controller.getPartnerById('invalid')).rejects.toThrow(
        'Invalid ID',
      );
    });
  });

  describe('getPartners', () => {
    it('should return all partners for organization', async () => {
      const mockPartners = [mockPartner];
      mockPartnersService.getPartners.mockResolvedValue(mockPartners);

      const result = await controller.getPartners();

      expect(mockPartnersService.getPartners).toHaveBeenCalled();
      expect(result).toEqual(mockPartners);
    });
  });

  describe('updatePartner', () => {
    it('should update partner successfully', async () => {
      const updateDto = {
        partnerName: 'Updated Partner',
        isActive: false,
      };

      mockValidationService.validate
        .mockReturnValueOnce('partner-123')
        .mockReturnValueOnce(updateDto);
      mockPartnersService.updatePartner.mockResolvedValue({
        ...mockPartner,
        ...updateDto,
      });

      const result = await controller.updatePartner('partner-123', updateDto);

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'partner-123',
      );
      expect(mockValidationService.validate).toHaveBeenCalledWith(
        expect.any(Object),
        updateDto,
      );
      expect(mockPartnersService.updatePartner).toHaveBeenCalledWith(
        'partner-123',
        updateDto,
      );
      expect(result).toEqual({ ...mockPartner, ...updateDto });
    });

    it('should throw validation error for invalid id', async () => {
      const updateDto = { partnerName: 'Updated Partner' };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(
        controller.updatePartner('invalid', updateDto),
      ).rejects.toThrow('Invalid ID');
    });

    it('should throw validation error for invalid update data', async () => {
      const invalidDto = { partnerName: '' };

      mockValidationService.validate
        .mockReturnValueOnce('partner-123')
        .mockImplementationOnce(() => {
          throw new Error('Invalid update data');
        });

      await expect(
        controller.updatePartner('partner-123', invalidDto),
      ).rejects.toThrow('Invalid update data');
    });
  });

  describe('deletePartner', () => {
    it('should delete partner successfully', async () => {
      mockValidationService.validate.mockReturnValue('partner-123');
      mockPartnersService.deletePartner.mockResolvedValue({ success: true });

      const result = await controller.deletePartner('partner-123');

      expect(mockValidationService.validate).toHaveBeenCalledWith(
        mockValidationService.schemas.id,
        'partner-123',
      );
      expect(mockPartnersService.deletePartner).toHaveBeenCalledWith(
        'partner-123',
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw validation error for invalid id', async () => {
      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(controller.deletePartner('invalid')).rejects.toThrow(
        'Invalid ID',
      );
    });
  });
});
