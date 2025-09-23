import { wellSchemas, apiNumberSchema } from '../schemas/well.schemas';
import {
  productionSchemas,
  nonNegativeVolumeSchema,
} from '../schemas/production.schemas';
import { leaseSchemas, percentageSchema } from '../schemas/lease.schemas';
import { organizationSchemas } from '../schemas/organization.schemas';
import { userSchemas } from '../schemas/user.schemas';
import { partnerSchemas } from '../schemas/partner.schemas';
import * as allSchemas from '../schemas/index';

describe('Validation Schemas', () => {
  describe('API Number Schema', () => {
    it('should validate correct 14-digit API numbers', () => {
      const validApiNumbers = [
        '42123456789012',
        '01001000000001',
        '48999123456789',
      ];

      validApiNumbers.forEach((apiNumber) => {
        const result = apiNumberSchema.safeParse(apiNumber);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid API number formats', () => {
      const invalidApiNumbers = [
        '123', // Too short
        '421234567890123', // Too long
        '42-123-456789', // Contains hyphens
        '42abc456789012', // Contains letters
        '00123456789012', // Invalid state code
        '42000456789012', // Invalid county code
      ];

      invalidApiNumbers.forEach((apiNumber) => {
        const result = apiNumberSchema.safeParse(apiNumber);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Well Schemas', () => {
    const validWellData = {
      apiNumber: '42123456789012',
      wellName: 'Test Well #1',
      wellType: 'OIL' as const,
      status: 'active' as const,
      totalDepth: 5000,
      latitude: 32.7767,
      longitude: -96.797,
    };

    it('should validate correct well creation data', () => {
      const result = wellSchemas.createWell.safeParse(validWellData);
      expect(result.success).toBe(true);
    });

    it('should reject well with invalid well type', () => {
      const invalidData = {
        ...validWellData,
        wellType: 'INVALID_TYPE',
      };

      const result = wellSchemas.createWell.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject well with negative total depth', () => {
      const invalidData = {
        ...validWellData,
        totalDepth: -1000,
      };

      const result = wellSchemas.createWell.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject well with invalid coordinates', () => {
      const invalidLatitude = {
        ...validWellData,
        latitude: 91, // Invalid latitude
      };

      const invalidLongitude = {
        ...validWellData,
        longitude: 181, // Invalid longitude
      };

      expect(wellSchemas.createWell.safeParse(invalidLatitude).success).toBe(
        false,
      );
      expect(wellSchemas.createWell.safeParse(invalidLongitude).success).toBe(
        false,
      );
    });

    it('should reject well with completion date before spud date', () => {
      const invalidData = {
        ...validWellData,
        spudDate: '2024-02-01T00:00:00Z',
        completionDate: '2024-01-01T00:00:00Z', // Before spud date
      };

      const result = wellSchemas.createWell.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject well with only latitude or longitude', () => {
      const onlyLatitude = {
        ...validWellData,
        latitude: 32.7767,
        longitude: undefined,
      };

      const onlyLongitude = {
        ...validWellData,
        latitude: undefined,
        longitude: -96.797,
      };

      expect(wellSchemas.createWell.safeParse(onlyLatitude).success).toBe(
        false,
      );
      expect(wellSchemas.createWell.safeParse(onlyLongitude).success).toBe(
        false,
      );
    });
  });

  describe('Production Schemas', () => {
    const validProductionData = {
      wellId: '123e4567-e89b-12d3-a456-426614174000',
      productionDate: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString(), // 30 days ago
      oilVolume: 100.5,
      gasVolume: 500.25,
      waterVolume: 25.0,
    };

    it('should validate correct production data', () => {
      const result =
        productionSchemas.createProductionRecord.safeParse(validProductionData);
      expect(result.success).toBe(true);
    });

    it('should reject production data with negative volumes', () => {
      const invalidData = {
        ...validProductionData,
        oilVolume: -10,
      };

      const result =
        productionSchemas.createProductionRecord.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject production data with no volumes', () => {
      const invalidData = {
        wellId: '123e4567-e89b-12d3-a456-426614174000',
        productionDate: '2024-01-15T00:00:00Z',
        // No volumes provided
      };

      const result =
        productionSchemas.createProductionRecord.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject production data with invalid well ID', () => {
      const invalidData = {
        ...validProductionData,
        wellId: 'invalid-uuid',
      };

      const result =
        productionSchemas.createProductionRecord.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject production data with future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);

      const invalidData = {
        ...validProductionData,
        productionDate: futureDate.toISOString(),
      };

      const result =
        productionSchemas.createProductionRecord.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject production data with very old date', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 years ago

      const invalidData = {
        ...validProductionData,
        productionDate: oldDate.toISOString(),
      };

      const result =
        productionSchemas.createProductionRecord.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate production data with optional fields', () => {
      const validDataWithOptionals = {
        ...validProductionData,
        oilPrice: 75.5,
        gasPrice: 3.25,
        waterDisposalCost: 2.0,
        notes: 'Test production record',
      };

      const result = productionSchemas.createProductionRecord.safeParse(
        validDataWithOptionals,
      );
      expect(result.success).toBe(true);
    });

    it('should validate production data with only oil volume', () => {
      const oilOnlyData = {
        wellId: '123e4567-e89b-12d3-a456-426614174000',
        productionDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        oilVolume: 100.5,
      };

      const result =
        productionSchemas.createProductionRecord.safeParse(oilOnlyData);
      expect(result.success).toBe(true);
    });

    it('should validate production data with only gas volume', () => {
      const gasOnlyData = {
        wellId: '123e4567-e89b-12d3-a456-426614174000',
        productionDate: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        gasVolume: 500.25,
      };

      const result =
        productionSchemas.createProductionRecord.safeParse(gasOnlyData);
      expect(result.success).toBe(true);
    });
  });

  describe('Lease Schemas', () => {
    const validLeaseData = {
      name: 'Test Lease',
      lessor: 'John Doe',
      lessee: 'Oil Company Inc.',
      acreage: 160.5,
      royaltyRate: 0.1875, // 18.75%
      effectiveDate: '2024-01-01T00:00:00Z',
      expirationDate: '2029-01-01T00:00:00Z',
    };

    it('should validate correct lease data', () => {
      const result = leaseSchemas.createLease.safeParse(validLeaseData);
      expect(result.success).toBe(true);
    });

    it('should reject lease with negative acreage', () => {
      const invalidData = {
        ...validLeaseData,
        acreage: -10,
      };

      const result = leaseSchemas.createLease.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject lease with invalid royalty rate', () => {
      const invalidData = {
        ...validLeaseData,
        royaltyRate: 1.5, // 150% - invalid
      };

      const result = leaseSchemas.createLease.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject lease with expiration before effective date', () => {
      const invalidData = {
        ...validLeaseData,
        effectiveDate: '2024-01-01T00:00:00Z',
        expirationDate: '2023-01-01T00:00:00Z', // Before effective date
      };

      const result = leaseSchemas.createLease.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject lease with empty required fields', () => {
      const invalidData = {
        ...validLeaseData,
        name: '', // Empty name
      };

      const result = leaseSchemas.createLease.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate lease with optional fields', () => {
      const validDataWithOptionals = {
        ...validLeaseData,
        primaryTerm: 5,
        secondaryTerm: 'As long as oil or gas is produced',
        bonusAmount: 1000.0,
        notes: 'Test lease with optional fields',
      };

      const result = leaseSchemas.createLease.safeParse(validDataWithOptionals);
      expect(result.success).toBe(true);
    });

    it('should validate lease without expiration date', () => {
      const validDataNoExpiration = {
        name: 'Test Lease',
        lessor: 'John Doe',
        lessee: 'Oil Company Inc.',
        acreage: 160.5,
        royaltyRate: 0.1875,
        effectiveDate: '2024-01-01T00:00:00Z',
        // No expiration date
      };

      const result = leaseSchemas.createLease.safeParse(validDataNoExpiration);
      expect(result.success).toBe(true);
    });
  });

  describe('Lease Partner Schemas', () => {
    const validLeasePartnerData = {
      leaseId: '123e4567-e89b-12d3-a456-426614174000',
      partnerId: '123e4567-e89b-12d3-a456-426614174001',
      workingInterestPercent: 0.5,
      royaltyInterestPercent: 0.125,
      netRevenueInterestPercent: 0.4,
      effectiveDate: '2024-01-01T00:00:00Z',
      isOperator: true,
    };

    it('should validate correct lease partner data', () => {
      const result = leaseSchemas.createLeasePartner.safeParse(
        validLeasePartnerData,
      );
      expect(result.success).toBe(true);
    });

    it('should reject lease partner with invalid percentages', () => {
      const invalidData = {
        ...validLeasePartnerData,
        workingInterestPercent: 1.5, // 150% - invalid
      };

      const result = leaseSchemas.createLeasePartner.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject lease partner with end date before effective date', () => {
      const invalidData = {
        ...validLeasePartnerData,
        effectiveDate: '2024-01-01T00:00:00Z',
        endDate: '2023-01-01T00:00:00Z', // Before effective date
      };

      const result = leaseSchemas.createLeasePartner.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Percentage Schema', () => {
    it('should validate correct percentages', () => {
      const validPercentages = [0, 0.1875, 0.5, 1.0];

      validPercentages.forEach((percentage) => {
        const result = percentageSchema.safeParse(percentage);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid percentages', () => {
      const invalidPercentages = [-0.1, 1.1, Infinity, NaN];

      invalidPercentages.forEach((percentage) => {
        const result = percentageSchema.safeParse(percentage);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Non-negative Volume Schema', () => {
    it('should validate non-negative volumes', () => {
      const validVolumes = [0, 0.1, 100, 1000.5];

      validVolumes.forEach((volume) => {
        const result = nonNegativeVolumeSchema.safeParse(volume);
        expect(result.success).toBe(true);
      });
    });

    it('should reject negative volumes', () => {
      const invalidVolumes = [-0.1, -100, -Infinity];

      invalidVolumes.forEach((volume) => {
        const result = nonNegativeVolumeSchema.safeParse(volume);
        expect(result.success).toBe(false);
      });
    });

    it('should reject non-finite volumes', () => {
      const invalidVolumes = [Infinity, -Infinity, NaN];

      invalidVolumes.forEach((volume) => {
        const result = nonNegativeVolumeSchema.safeParse(volume);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Organization Schemas', () => {
    it('should validate correct organization data', () => {
      const validData = {
        name: 'Test Organization',
        description: 'A test organization',
      };

      const result =
        organizationSchemas.createOrganization.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject organization with empty name', () => {
      const invalidData = {
        name: '',
        description: 'A test organization',
      };

      const result =
        organizationSchemas.createOrganization.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('User Schemas', () => {
    it('should validate correct user data', () => {
      const validData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'manager' as const,
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = userSchemas.createUser.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject user with invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = userSchemas.createUser.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Partner Schemas', () => {
    it('should validate correct partner data', () => {
      const validData = {
        partnerName: 'Test Partner',
        partnerCode: 'TP001',
        contactEmail: 'contact@partner.com',
      };

      const result = partnerSchemas.createPartner.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject partner with empty name', () => {
      const invalidData = {
        partnerName: '',
        partnerCode: 'TP001',
      };

      const result = partnerSchemas.createPartner.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Schema Index Exports', () => {
    it('should export all schema modules', () => {
      expect(allSchemas.wellSchemas).toBeDefined();
      expect(allSchemas.productionSchemas).toBeDefined();
      expect(allSchemas.leaseSchemas).toBeDefined();
      expect(allSchemas.organizationSchemas).toBeDefined();
      expect(allSchemas.userSchemas).toBeDefined();
      expect(allSchemas.partnerSchemas).toBeDefined();
    });
  });
});
