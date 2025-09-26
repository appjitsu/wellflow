import { CreateCashCallCommand } from './create-cash-call.command';

describe('CreateCashCallCommand', () => {
  const validOrganizationId = 'org-123';
  const validLeaseId = 'lease-456';
  const validPartnerId = 'partner-789';
  const validBillingMonth = '2024-03-01';
  const validAmount = '15000.00';
  const validTypeMonthly = 'MONTHLY' as const;
  const validTypeSupplemental = 'SUPPLEMENTAL' as const;
  const validOptions = {
    dueDate: '2024-03-15',
    interestRatePercent: '5.25',
    consentRequired: true,
  };

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.billingMonth).toBe(validBillingMonth);
      expect(command.amount).toBe(validAmount);
      expect(command.type).toBe('MONTHLY');
      expect(command.options).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeSupplemental,
        validOptions,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.billingMonth).toBe(validBillingMonth);
      expect(command.amount).toBe(validAmount);
      expect(command.type).toBe('SUPPLEMENTAL');
      expect(command.options).toEqual(validOptions);
    });

    it('should create a command with partial options', () => {
      const partialOptions = {
        consentRequired: false,
      };

      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
        partialOptions,
      );

      expect(command.type).toBe('MONTHLY');
      expect(command.options).toEqual(partialOptions);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
        validOptions,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.leaseId).toBeDefined();
      expect(command.partnerId).toBeDefined();
      expect(command.billingMonth).toBeDefined();
      expect(command.amount).toBeDefined();
      expect(command.type).toBeDefined();
      expect(command.options).toBeDefined();
    });

    it('should maintain object reference for options', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
        validOptions,
      );

      expect(command.options).toBe(validOptions);
    });
  });

  describe('type union type', () => {
    it('should accept MONTHLY as valid type', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        'MONTHLY',
      );

      expect(command.type).toBe('MONTHLY');
    });

    it('should accept SUPPLEMENTAL as valid type', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        'SUPPLEMENTAL',
      );

      expect(command.type).toBe('SUPPLEMENTAL');
    });
  });

  describe('options object', () => {
    it('should handle empty options object', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
        {},
      );

      expect(command.options).toEqual({});
    });

    it('should handle null values in options', () => {
      const optionsWithNull = {
        dueDate: null,
        interestRatePercent: null,
        consentRequired: false,
      };

      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
        optionsWithNull,
      );

      expect(command.options?.dueDate).toBeNull();
      expect(command.options?.interestRatePercent).toBeNull();
      expect(command.options?.consentRequired).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle zero amount', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        '0.00',
        validTypeMonthly,
      );

      expect(command.amount).toBe('0.00');
    });

    it('should handle undefined options', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
        undefined,
      );

      expect(command.options).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateCashCallCommand(
        validOrganizationId,
        validLeaseId,
        validPartnerId,
        validBillingMonth,
        validAmount,
        validTypeMonthly,
        validOptions,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const type1 = command.type;
      const type2 = command.type;

      expect(orgId1).toBe(orgId2);
      expect(type1).toBe(type2);
    });
  });
});
