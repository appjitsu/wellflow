import { validate } from 'class-validator';
import { CreateJoaDto } from '../create-joa.dto';

describe('CreateJoaDto', () => {
  const createValidDto = (
    overrides: Partial<CreateJoaDto> = {},
  ): CreateJoaDto => {
    const dto = new CreateJoaDto();
    Object.assign(dto, {
      organizationId: 'org-123',
      agreementNumber: 'AG-1001',
      effectiveDate: '2025-01-01',
      ...overrides,
    });
    return dto;
  };

  describe('organizationId', () => {
    it('should validate successfully with valid organizationId', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when organizationId is empty', async () => {
      const dto = createValidDto({ organizationId: '' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(true);
    });

    it('should fail validation when organizationId is undefined', async () => {
      const dto = createValidDto();
      delete (dto as any).organizationId;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('agreementNumber', () => {
    it('should validate successfully with valid agreementNumber', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when agreementNumber is empty', async () => {
      const dto = createValidDto({ agreementNumber: '' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(true);
    });
  });

  describe('effectiveDate', () => {
    it('should validate successfully with valid date string', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid date format', async () => {
      const dto = createValidDto({ effectiveDate: '01-01-2025' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isDateString)).toBe(
        true,
      );
    });

    it('should fail validation with non-date string', async () => {
      const dto = createValidDto({ effectiveDate: 'not-a-date' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isDateString)).toBe(
        true,
      );
    });
  });

  describe('optional fields', () => {
    it('should validate successfully with all optional fields provided', async () => {
      const dto = createValidDto({
        endDate: '2025-12-31',
        operatorOverheadPercent: '10.00',
        votingThresholdPercent: '66.67',
        nonConsentPenaltyPercent: '5.00',
        terms: { clause1: 'value1', clause2: 'value2' },
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with optional fields omitted', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    describe('endDate', () => {
      it('should validate successfully with valid date string', async () => {
        const dto = createValidDto({ endDate: '2025-12-31' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null endDate', async () => {
        const dto = createValidDto({ endDate: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid date format', async () => {
        const dto = createValidDto({ endDate: '12-31-2025' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isDateString)).toBe(
          true,
        );
      });
    });

    describe('operatorOverheadPercent', () => {
      it('should validate successfully with valid percentage', async () => {
        const dto = createValidDto({ operatorOverheadPercent: '10.00' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null operatorOverheadPercent', async () => {
        const dto = createValidDto({ operatorOverheadPercent: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid percentage format', async () => {
        const dto = createValidDto({ operatorOverheadPercent: '10.0' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.matches)).toBe(true);
      });

      it('should fail validation with non-numeric percentage', async () => {
        const dto = createValidDto({ operatorOverheadPercent: 'abc' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.matches)).toBe(true);
      });
    });

    describe('votingThresholdPercent', () => {
      it('should validate successfully with valid percentage', async () => {
        const dto = createValidDto({ votingThresholdPercent: '66.67' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null votingThresholdPercent', async () => {
        const dto = createValidDto({ votingThresholdPercent: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid percentage format', async () => {
        const dto = createValidDto({ votingThresholdPercent: '66.6' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.matches)).toBe(true);
      });
    });

    describe('nonConsentPenaltyPercent', () => {
      it('should validate successfully with valid percentage', async () => {
        const dto = createValidDto({ nonConsentPenaltyPercent: '5.00' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null nonConsentPenaltyPercent', async () => {
        const dto = createValidDto({ nonConsentPenaltyPercent: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid percentage format', async () => {
        const dto = createValidDto({ nonConsentPenaltyPercent: '5.0' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.matches)).toBe(true);
      });
    });

    describe('terms', () => {
      it('should validate successfully with valid terms object', async () => {
        const dto = createValidDto({
          terms: { clause1: 'value1', clause2: 123 },
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null terms', async () => {
        const dto = createValidDto({ terms: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with undefined terms', async () => {
        const dto = createValidDto({ terms: undefined });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
  });

  describe('complete valid DTO', () => {
    it('should validate successfully with all fields', async () => {
      const dto = createValidDto({
        endDate: '2025-12-31',
        operatorOverheadPercent: '10.00',
        votingThresholdPercent: '66.67',
        nonConsentPenaltyPercent: '5.00',
        terms: { clause1: 'value1', clause2: 'value2' },
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with minimal required fields only', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
