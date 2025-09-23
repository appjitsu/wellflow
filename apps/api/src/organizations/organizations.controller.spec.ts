import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { ValidationService } from '../common/validation/validation.service';
import { TenantGuard } from '../common/tenant/tenant.guard';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let organizationsService: OrganizationsService;
  let validationService: ValidationService;

  const mockOrganizationsService = {
    createOrganization: jest.fn(),
    getCurrentOrganization: jest.fn(),
    getOrganizationById: jest.fn(),
    updateOrganization: jest.fn(),
    deleteOrganization: jest.fn(),
    getOrganizationStats: jest.fn(),
  };

  const mockValidationService = {
    validate: jest.fn(),
    schemas: {
      id: 'mock-id-schema',
    },
  };

  const mockTenantGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
        {
          provide: ValidationService,
          useValue: mockValidationService,
        },
      ],
    })
      .overrideGuard(TenantGuard)
      .useValue(mockTenantGuard)
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    organizationsService =
      module.get<OrganizationsService>(OrganizationsService);
    validationService = module.get<ValidationService>(ValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrganization', () => {
    it('should create an organization successfully', async () => {
      const createDto = {
        name: 'Test Organization',
        description: 'A test organization',
        contactEmail: 'test@example.com',
        contactPhone: '+1-555-0123',
      };

      const expectedResult = {
        id: 'org-123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValidationService.validate.mockReturnValue(createDto);
      mockOrganizationsService.createOrganization.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.createOrganization(createDto);

      expect(validationService.validate).toHaveBeenCalledWith(
        expect.any(Object), // createOrganizationSchema
        createDto,
      );
      expect(organizationsService.createOrganization).toHaveBeenCalledWith(
        createDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle validation errors', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        contactEmail: 'invalid-email', // Invalid: wrong format
      };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      await expect(
        controller.createOrganization(invalidDto as any),
      ).rejects.toThrow('Validation failed');
    });

    it('should handle service errors', async () => {
      const createDto = {
        name: 'Test Organization',
      };

      mockValidationService.validate.mockReturnValue(createDto);
      mockOrganizationsService.createOrganization.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.createOrganization(createDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getCurrentOrganization', () => {
    it('should return current organization', async () => {
      const mockOrganization = {
        id: 'org-123',
        name: 'Current Organization',
        description: 'Current org description',
      };

      mockOrganizationsService.getCurrentOrganization.mockResolvedValue(
        mockOrganization,
      );

      const result = await controller.getCurrentOrganization();

      expect(organizationsService.getCurrentOrganization).toHaveBeenCalled();
      expect(result).toEqual(mockOrganization);
    });

    it('should handle service errors', async () => {
      mockOrganizationsService.getCurrentOrganization.mockRejectedValue(
        new Error('Organization not found'),
      );

      await expect(controller.getCurrentOrganization()).rejects.toThrow(
        'Organization not found',
      );
    });
  });

  describe('getOrganizationById', () => {
    it('should return organization by id', async () => {
      const orgId = 'org-123';
      const mockOrganization = {
        id: orgId,
        name: 'Test Organization',
        description: 'Test description',
      };

      mockValidationService.validate.mockReturnValue(orgId);
      mockOrganizationsService.getOrganizationById.mockResolvedValue(
        mockOrganization,
      );

      const result = await controller.getOrganizationById(orgId);

      expect(validationService.validate).toHaveBeenCalledWith(
        'mock-id-schema',
        orgId,
      );
      expect(organizationsService.getOrganizationById).toHaveBeenCalledWith(
        orgId,
      );
      expect(result).toEqual(mockOrganization);
    });

    it('should handle validation errors', async () => {
      const invalidId = '';

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID format');
      });

      await expect(controller.getOrganizationById(invalidId)).rejects.toThrow(
        'Invalid ID format',
      );
    });

    it('should handle not found errors', async () => {
      const orgId = 'org-999';

      mockValidationService.validate.mockReturnValue(orgId);
      mockOrganizationsService.getOrganizationById.mockRejectedValue(
        new Error('Organization not found'),
      );

      await expect(controller.getOrganizationById(orgId)).rejects.toThrow(
        'Organization not found',
      );
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      const orgId = 'org-123';
      const updateDto = {
        name: 'Updated Organization',
        description: 'Updated description',
        contactEmail: 'updated@example.com',
      };

      const expectedResult = {
        id: orgId,
        ...updateDto,
        updatedAt: new Date(),
      };

      mockValidationService.validate
        .mockReturnValueOnce(orgId) // For ID validation
        .mockReturnValueOnce(updateDto); // For DTO validation
      mockOrganizationsService.updateOrganization.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.updateOrganization(orgId, updateDto);

      expect(validationService.validate).toHaveBeenCalledWith(
        'mock-id-schema',
        orgId,
      );
      expect(validationService.validate).toHaveBeenCalledWith(
        expect.any(Object), // updateOrganizationSchema
        updateDto,
      );
      expect(organizationsService.updateOrganization).toHaveBeenCalledWith(
        orgId,
        updateDto,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle validation errors for id', async () => {
      const invalidId = '';
      const updateDto = { name: 'Updated Name' };

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(
        controller.updateOrganization(invalidId, updateDto),
      ).rejects.toThrow('Invalid ID');
    });

    it('should handle validation errors for dto', async () => {
      const orgId = 'org-123';
      const invalidDto = { contactEmail: 'invalid-email' };

      mockValidationService.validate
        .mockReturnValueOnce(orgId)
        .mockImplementation(() => {
          throw new Error('Invalid email format');
        });

      await expect(
        controller.updateOrganization(orgId, invalidDto as any),
      ).rejects.toThrow('Invalid email format');
    });

    it('should handle service errors', async () => {
      const orgId = 'org-123';
      const updateDto = { name: 'Updated Name' };

      mockValidationService.validate
        .mockReturnValueOnce(orgId)
        .mockReturnValueOnce(updateDto);
      mockOrganizationsService.updateOrganization.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(
        controller.updateOrganization(orgId, updateDto),
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteOrganization', () => {
    it('should delete organization successfully', async () => {
      const orgId = 'org-123';
      const expectedResult = {
        id: orgId,
        name: 'Deleted Organization',
        deletedAt: new Date(),
      };

      mockValidationService.validate.mockReturnValue(orgId);
      mockOrganizationsService.deleteOrganization.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.deleteOrganization(orgId);

      expect(validationService.validate).toHaveBeenCalledWith(
        'mock-id-schema',
        orgId,
      );
      expect(organizationsService.deleteOrganization).toHaveBeenCalledWith(
        orgId,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle validation errors', async () => {
      const invalidId = '';

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(controller.deleteOrganization(invalidId)).rejects.toThrow(
        'Invalid ID',
      );
    });

    it('should handle service errors', async () => {
      const orgId = 'org-123';

      mockValidationService.validate.mockReturnValue(orgId);
      mockOrganizationsService.deleteOrganization.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(controller.deleteOrganization(orgId)).rejects.toThrow(
        'Delete failed',
      );
    });
  });

  describe('getOrganizationStats', () => {
    it('should return organization statistics', async () => {
      const orgId = 'org-123';
      const mockStats = {
        organization: {
          id: orgId,
          name: 'Test Organization',
        },
        stats: {
          totalWells: 15,
          totalUsers: 8,
          totalProductionRecords: 1250,
        },
      };

      mockValidationService.validate.mockReturnValue(orgId);
      mockOrganizationsService.getOrganizationStats.mockResolvedValue(
        mockStats,
      );

      const result = await controller.getOrganizationStats(orgId);

      expect(validationService.validate).toHaveBeenCalledWith(
        'mock-id-schema',
        orgId,
      );
      expect(organizationsService.getOrganizationStats).toHaveBeenCalledWith(
        orgId,
      );
      expect(result).toEqual(mockStats);
    });

    it('should handle validation errors', async () => {
      const invalidId = '';

      mockValidationService.validate.mockImplementation(() => {
        throw new Error('Invalid ID');
      });

      await expect(controller.getOrganizationStats(invalidId)).rejects.toThrow(
        'Invalid ID',
      );
    });

    it('should handle service errors', async () => {
      const orgId = 'org-123';

      mockValidationService.validate.mockReturnValue(orgId);
      mockOrganizationsService.getOrganizationStats.mockRejectedValue(
        new Error('Stats calculation failed'),
      );

      await expect(controller.getOrganizationStats(orgId)).rejects.toThrow(
        'Stats calculation failed',
      );
    });
  });
});
