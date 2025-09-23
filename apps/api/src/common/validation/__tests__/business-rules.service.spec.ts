import { Test, TestingModule } from '@nestjs/testing';
import { BusinessRulesService } from '../business-rules.service';
import { DatabaseService } from '../../../database/database.service';
import { ConfigService } from '@nestjs/config';

// Mock database service
const mockDatabaseService = {
  db: {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    limit: jest.fn(),
  },
};

describe('BusinessRulesService', () => {
  let service: BusinessRulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessRulesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test'),
          },
        },
      ],
    }).compile();

    service = module.get<BusinessRulesService>(BusinessRulesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateApiNumber', () => {
    it('should validate correct API number format', async () => {
      // Mock database query to return no existing wells
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateApiNumber(
        '42123456789012',
        'org-id',
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stateCode).toBe('42');
      expect(result.countyCode).toBe('123');
      expect(result.wellSequence).toBe('456789012');
    });

    it('should reject API number with invalid format', async () => {
      const result = await service.validateApiNumber('invalid', 'org-id');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API number must be exactly 14 digits');
    });

    it('should reject API number with invalid state code', async () => {
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateApiNumber(
        '00123456789012',
        'org-id',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('State code must be between 01 and 99');
    });

    it('should reject API number with invalid county code', async () => {
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateApiNumber(
        '42000456789012',
        'org-id',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'County code must be between 001 and 999',
      );
    });

    it('should reject duplicate API number in same organization', async () => {
      // Mock database query to return existing well
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'existing-well-id' }]),
          }),
        }),
      });

      const result = await service.validateApiNumber(
        '42123456789012',
        'org-id',
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'API number already exists in this organization',
      );
    });

    it('should handle database errors gracefully', async () => {
      // Mock database query to throw error
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const result = await service.validateApiNumber(
        '42123456789012',
        'org-id',
      );

      expect(result.warnings).toContain(
        'Could not verify API number uniqueness',
      );
    });
  });

  describe('validateProductionData', () => {
    const validContext = {
      wellId: 'well-id',
      productionDate: new Date('2024-01-15'),
      oilVolume: 100,
      gasVolume: 500,
      waterVolume: 50,
      organizationId: 'org-id',
    };

    it('should validate correct production data', async () => {
      // Mock well exists and is active
      mockDatabaseService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue([{ status: 'active', wellType: 'OIL' }]),
          }),
        }),
      });

      // Mock no duplicate production records
      mockDatabaseService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateProductionData(validContext);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject production data for non-existent well', async () => {
      // Mock well not found
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateProductionData(validContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Well not found or not accessible');
    });

    it('should reject future production dates', async () => {
      const futureContext = {
        ...validContext,
        productionDate: new Date('2025-12-31'),
      };

      // Mock well exists
      mockDatabaseService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue([{ status: 'active', wellType: 'OIL' }]),
          }),
        }),
      });

      const result = await service.validateProductionData(futureContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Production date cannot be in the future',
      );
    });

    it('should warn about high volumes', async () => {
      const highVolumeContext = {
        ...validContext,
        oilVolume: 15000, // Exceeds typical maximum
      };

      // Mock well exists
      mockDatabaseService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue([{ status: 'active', wellType: 'OIL' }]),
          }),
        }),
      });

      // Mock no duplicate records
      mockDatabaseService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateProductionData(highVolumeContext);

      expect(
        result.warnings.some((warning) =>
          warning.includes('Oil volume (15000) exceeds typical maximum'),
        ),
      ).toBe(true);
    });

    it('should reject duplicate production records', async () => {
      // Mock well exists
      mockDatabaseService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue([{ status: 'active', wellType: 'OIL' }]),
          }),
        }),
      });

      // Mock existing production record
      mockDatabaseService.db.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'existing-record-id' }]),
          }),
        }),
      });

      const result = await service.validateProductionData(validContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Production record already exists for this well and date',
      );
    });
  });

  describe('validateLeasePartnerOwnership', () => {
    const validContext = {
      leaseId: 'lease-id',
      partnerId: 'partner-id',
      workingInterestPercent: 0.5,
      royaltyInterestPercent: 0.125,
      netRevenueInterestPercent: 0.4,
      effectiveDate: new Date('2024-01-01'),
      organizationId: 'org-id',
    };

    it('should validate correct ownership percentages', async () => {
      // Mock existing partners query
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockReturnValue([
              { workingInterestPercent: '0.3', partnerId: 'other-partner' },
            ]),
        }),
      });

      const result = await service.validateLeasePartnerOwnership(validContext);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when working interest is less than net revenue interest', async () => {
      const invalidContext = {
        ...validContext,
        workingInterestPercent: 0.3,
        netRevenueInterestPercent: 0.5, // Higher than working interest
      };

      const result =
        await service.validateLeasePartnerOwnership(invalidContext);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Working interest percentage must be greater than or equal to net revenue interest percentage',
      );
    });

    it('should reject when total working interest exceeds 100%', async () => {
      // Mock existing partners with high working interest
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockReturnValue([
              { workingInterestPercent: '0.8', partnerId: 'other-partner' },
            ]),
        }),
      });

      const result = await service.validateLeasePartnerOwnership(validContext);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('Total working interest would exceed 100%'),
        ),
      ).toBe(true);
    });
  });

  describe('validateLeaseAccess', () => {
    it('should validate accessible active lease', async () => {
      // Mock lease exists and is active
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ status: 'active' }]),
          }),
        }),
      });

      const result = await service.validateLeaseAccess('lease-id', 'org-id');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-existent lease', async () => {
      // Mock lease not found
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await service.validateLeaseAccess('lease-id', 'org-id');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Lease not found or not accessible');
    });

    it('should warn about expired lease', async () => {
      // Mock expired lease
      mockDatabaseService.db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ status: 'expired' }]),
          }),
        }),
      });

      const result = await service.validateLeaseAccess('lease-id', 'org-id');

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Lease has expired');
    });
  });
});
