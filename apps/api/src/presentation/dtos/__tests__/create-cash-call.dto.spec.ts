import { validate } from 'class-validator';
import { CreateCashCallDto } from '../create-cash-call.dto';

describe('CreateCashCallDto', () => {
  const createValidDto = (
    overrides: Partial<CreateCashCallDto> = {},
  ): CreateCashCallDto => {
    const dto = new CreateCashCallDto();
    Object.assign(dto, {
      organizationId: 'org-123',
      leaseId: 'lease-456',
      partnerId: 'partner-789',
      billingMonth: '2024-01-01',
      amount: '1000.00',
      type: 'MONTHLY' as const,
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
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when organizationId is undefined', async () => {
      const dto = createValidDto();
      delete (dto as any).organizationId;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('leaseId', () => {
    it('should validate successfully with valid leaseId', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when leaseId is empty', async () => {
      const dto = createValidDto({ leaseId: '' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(true);
    });
  });

  describe('partnerId', () => {
    it('should validate successfully with valid partnerId', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when partnerId is empty', async () => {
      const dto = createValidDto({ partnerId: '' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(true);
    });
  });

  describe('billingMonth', () => {
    it('should validate successfully with valid date string', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid date format', async () => {
      const dto = createValidDto({ billingMonth: '01-01-2024' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isDateString)).toBe(
        true,
      );
    });
  });

  describe('amount', () => {
    it('should validate successfully with valid decimal amount', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with negative amount', async () => {
      const dto = createValidDto({ amount: '-500.00' });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid decimal format', async () => {
      const dto = createValidDto({ amount: '1000.0' });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.matches)).toBe(true);
    });
  });

  describe('type', () => {
    it('should validate successfully with MONTHLY type', async () => {
      const dto = createValidDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with SUPPLEMENTAL type', async () => {
      const dto = createValidDto({ type: 'SUPPLEMENTAL' });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid type', async () => {
      const dto = createValidDto({ type: 'INVALID' as any });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((error) => error.constraints?.isEnum)).toBe(true);
    });
  });

  describe('optional fields', () => {
    it('should validate successfully with all optional fields provided', async () => {
      const dto = createValidDto({
        dueDate: '2024-01-15',
        interestRatePercent: '8.50',
        consentRequired: true,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    describe('dueDate', () => {
      it('should validate successfully with valid date string', async () => {
        const dto = createValidDto({ dueDate: '2024-01-15' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null dueDate', async () => {
        const dto = createValidDto({ dueDate: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid date format', async () => {
        const dto = createValidDto({ dueDate: '01-15-2024' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isDateString)).toBe(
          true,
        );
      });
    });

    describe('interestRatePercent', () => {
      it('should validate successfully with valid percentage', async () => {
        const dto = createValidDto({ interestRatePercent: '8.50' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null interestRatePercent', async () => {
        const dto = createValidDto({ interestRatePercent: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid percentage format', async () => {
        const dto = createValidDto({ interestRatePercent: '8.5' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.matches)).toBe(true);
      });
    });

    describe('consentRequired', () => {
      it('should validate successfully with boolean true', async () => {
        const dto = createValidDto({ consentRequired: true });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with boolean false', async () => {
        const dto = createValidDto({ consentRequired: false });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with non-boolean value', async () => {
        const dto = createValidDto();
        (dto as any).consentRequired = 'true';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isBoolean)).toBe(true);
      });
    });
  });
});
