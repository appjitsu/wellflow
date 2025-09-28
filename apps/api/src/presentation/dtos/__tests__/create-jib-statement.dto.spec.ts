import { validate } from 'class-validator';
import {
  CreateJibStatementDto,
  JibLineItemDto,
} from '../create-jib-statement.dto';

describe('CreateJibStatementDto', () => {
  const createValidDto = (
    overrides: Partial<CreateJibStatementDto> = {},
  ): CreateJibStatementDto => {
    const dto = new CreateJibStatementDto();
    Object.assign(dto, {
      organizationId: 'org-123',
      leaseId: 'lease-456',
      partnerId: 'partner-789',
      statementPeriodStart: '2025-01-01',
      statementPeriodEnd: '2025-01-31',
      ...overrides,
    });
    return dto;
  };

  const createValidLineItem = (
    overrides: Partial<JibLineItemDto> = {},
  ): JibLineItemDto => {
    const item = new JibLineItemDto();
    Object.assign(item, {
      type: 'revenue',
      description: 'Oil sales',
      ...overrides,
    });
    return item;
  };

  describe('required fields', () => {
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
        expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(
          true,
        );
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
        expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(
          true,
        );
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
        expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(
          true,
        );
      });
    });

    describe('statementPeriodStart', () => {
      it('should validate successfully with valid date string', async () => {
        const dto = createValidDto();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid date format', async () => {
        const dto = createValidDto({ statementPeriodStart: '01-01-2025' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isDateString)).toBe(
          true,
        );
      });
    });

    describe('statementPeriodEnd', () => {
      it('should validate successfully with valid date string', async () => {
        const dto = createValidDto();

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid date format', async () => {
        const dto = createValidDto({ statementPeriodEnd: '01-31-2025' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isDateString)).toBe(
          true,
        );
      });
    });
  });

  describe('optional fields', () => {
    describe('dueDate', () => {
      it('should validate successfully with valid date string', async () => {
        const dto = createValidDto({ dueDate: '2025-02-15' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null dueDate', async () => {
        const dto = createValidDto({ dueDate: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid date format', async () => {
        const dto = createValidDto({ dueDate: '02-15-2025' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isDateString)).toBe(
          true,
        );
      });
    });

    describe('financial fields', () => {
      it('should validate successfully with valid grossRevenue', async () => {
        const dto = createValidDto({ grossRevenue: '10000.00' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with valid netRevenue', async () => {
        const dto = createValidDto({ netRevenue: '8000.00' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with valid workingInterestShare', async () => {
        const dto = createValidDto({ workingInterestShare: '50.00' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with valid royaltyShare', async () => {
        const dto = createValidDto({ royaltyShare: '12.50' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with valid previousBalance', async () => {
        const dto = createValidDto({ previousBalance: '0.00' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with valid currentBalance', async () => {
        const dto = createValidDto({ currentBalance: '1000.00' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid decimal format for grossRevenue', async () => {
        const dto = createValidDto({ grossRevenue: '10000.000' }); // 3 decimal places, max 2

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should fail validation with invalid decimal format for workingInterestShare', async () => {
        const dto = createValidDto({ workingInterestShare: '50.000' }); // 3 decimal places, max 2

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    describe('lineItems', () => {
      it('should validate successfully with valid line items', async () => {
        const dto = createValidDto({
          lineItems: [
            createValidLineItem({
              amount: '10000.00',
              quantity: '100.000',
              unitCost: '100.00',
            }),
            createValidLineItem({
              type: 'expense',
              description: 'Equipment maintenance',
              amount: '500.00',
            }),
          ],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null lineItems', async () => {
        const dto = createValidDto({ lineItems: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with empty lineItems array', async () => {
        const dto = createValidDto({ lineItems: [] });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid line item type', async () => {
        const dto = createValidDto({
          lineItems: [createValidLineItem({ type: 'invalid' as any })],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        // Validation should fail for invalid type
      });
    });

    describe('status', () => {
      it('should validate successfully with draft status', async () => {
        const dto = createValidDto({ status: 'draft' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with sent status', async () => {
        const dto = createValidDto({ status: 'sent' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with paid status', async () => {
        const dto = createValidDto({ status: 'paid' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid status', async () => {
        const dto = createValidDto({ status: 'invalid' as any });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isIn)).toBe(true);
      });
    });

    describe('sentAt and paidAt', () => {
      it('should validate successfully with valid sentAt date', async () => {
        const dto = createValidDto({ sentAt: '2025-01-15' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with valid paidAt date', async () => {
        const dto = createValidDto({ paidAt: '2025-01-20' });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with null sentAt and paidAt', async () => {
        const dto = createValidDto({ sentAt: null, paidAt: null });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid sentAt format', async () => {
        const dto = createValidDto({ sentAt: '01-15-2025' });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isDateString)).toBe(
          true,
        );
      });
    });
  });

  describe('JibLineItemDto', () => {
    describe('type', () => {
      it('should validate successfully with revenue type', async () => {
        const item = createValidLineItem();

        const errors = await validate(item);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with expense type', async () => {
        const item = createValidLineItem({ type: 'expense' });

        const errors = await validate(item);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid type', async () => {
        const item = createValidLineItem({ type: 'invalid' as any });

        const errors = await validate(item);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isIn)).toBe(true);
      });
    });

    describe('description', () => {
      it('should validate successfully with valid description', async () => {
        const item = createValidLineItem();

        const errors = await validate(item);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with empty description', async () => {
        const item = createValidLineItem({ description: '' });

        const errors = await validate(item);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some((error) => error.constraints?.isNotEmpty)).toBe(
          true,
        );
      });
    });

    describe('optional fields', () => {
      it('should validate successfully with all optional fields', async () => {
        const item = createValidLineItem({
          amount: '10000.00',
          quantity: '100.000',
          unitCost: '100.00',
        });

        const errors = await validate(item);
        expect(errors.length).toBe(0);
      });

      it('should validate successfully with only required fields', async () => {
        const item = createValidLineItem();

        const errors = await validate(item);
        expect(errors.length).toBe(0);
      });

      it('should fail validation with invalid amount format', async () => {
        const item = createValidLineItem({ amount: '10000.000' }); // 3 decimal places, max 2

        const errors = await validate(item);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should fail validation with invalid quantity format', async () => {
        const item = createValidLineItem({ quantity: '100.0000' }); // 4 decimal places, max 3

        const errors = await validate(item);
        expect(errors.length).toBeGreaterThan(0);
      });

      it('should fail validation with invalid unitCost format', async () => {
        const item = createValidLineItem({ unitCost: '100.000' }); // 3 decimal places, max 2

        const errors = await validate(item);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('complete valid DTO', () => {
    it('should validate successfully with all fields', async () => {
      const dto = createValidDto({
        dueDate: '2025-02-15',
        grossRevenue: '10000.00',
        netRevenue: '8000.00',
        workingInterestShare: '50.00',
        royaltyShare: '12.50',
        previousBalance: '0.00',
        currentBalance: '1000.00',
        lineItems: [
          createValidLineItem({
            amount: '10000.00',
            quantity: '100.000',
            unitCost: '100.00',
          }),
        ],
        status: 'draft',
        sentAt: '2025-01-15',
        paidAt: null,
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
