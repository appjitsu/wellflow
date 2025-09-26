import { CreateOwnerPaymentCommand } from './create-owner-payment.command';

describe('CreateOwnerPaymentCommand', () => {
  const validOrganizationId = 'org-123';
  const validPartnerId = 'partner-456';
  const validMethodCheck = 'CHECK' as const;
  const validMethodAch = 'ACH' as const;
  const validMethodWire = 'WIRE' as const;
  const validGrossAmount = '10000.00';
  const validNetAmount = '9500.00';
  const validRevenueDistributionId = 'dist-789';
  const validOptions = {
    deductionsAmount: '500.00',
    taxWithheldAmount: '200.00',
    checkNumber: 'CHK-001',
    achTraceNumber: 'ACH-123456',
    memo: 'Monthly payment',
    paymentDate: new Date('2024-03-15'),
  };

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.method).toBe('CHECK');
      expect(command.grossAmount).toBe(validGrossAmount);
      expect(command.netAmount).toBe(validNetAmount);
      expect(command.revenueDistributionId).toBe(validRevenueDistributionId);
      expect(command.options).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodAch,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        validOptions,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.method).toBe('ACH');
      expect(command.grossAmount).toBe(validGrossAmount);
      expect(command.netAmount).toBe(validNetAmount);
      expect(command.revenueDistributionId).toBe(validRevenueDistributionId);
      expect(command.options).toEqual(validOptions);
    });

    it('should create a command with partial options', () => {
      const partialOptions = {
        checkNumber: 'CHK-002',
        memo: 'Partial payment',
      };

      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodWire,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        partialOptions,
      );

      expect(command.method).toBe('WIRE');
      expect(command.options).toEqual(partialOptions);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        validOptions,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.partnerId).toBeDefined();
      expect(command.method).toBeDefined();
      expect(command.grossAmount).toBeDefined();
      expect(command.netAmount).toBeDefined();
      expect(command.revenueDistributionId).toBeDefined();
      expect(command.options).toBeDefined();
    });

    it('should maintain object reference for options', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        validOptions,
      );

      expect(command.options).toBe(validOptions);
    });
  });

  describe('method union type', () => {
    it('should accept CHECK as valid method', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        'CHECK',
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
      );

      expect(command.method).toBe('CHECK');
    });

    it('should accept ACH as valid method', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        'ACH',
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
      );

      expect(command.method).toBe('ACH');
    });

    it('should accept WIRE as valid method', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        'WIRE',
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
      );

      expect(command.method).toBe('WIRE');
    });
  });

  describe('options object', () => {
    it('should handle empty options object', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        {},
      );

      expect(command.options).toEqual({});
    });

    it('should maintain date reference in options', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        validOptions,
      );

      expect(command.options?.paymentDate).toBe(validOptions.paymentDate);
    });
  });

  describe('edge cases', () => {
    it('should handle zero amounts', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        '0.00',
        '0.00',
        validRevenueDistributionId,
      );

      expect(command.grossAmount).toBe('0.00');
      expect(command.netAmount).toBe('0.00');
    });

    it('should handle empty strings in options', () => {
      const optionsWithEmpty = {
        checkNumber: '',
        achTraceNumber: '',
        memo: '',
      };

      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        optionsWithEmpty,
      );

      expect(command.options?.checkNumber).toBe('');
      expect(command.options?.achTraceNumber).toBe('');
      expect(command.options?.memo).toBe('');
    });

    it('should handle undefined options', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        undefined,
      );

      expect(command.options).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateOwnerPaymentCommand(
        validOrganizationId,
        validPartnerId,
        validMethodCheck,
        validGrossAmount,
        validNetAmount,
        validRevenueDistributionId,
        validOptions,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const method1 = command.method;
      const method2 = command.method;

      expect(orgId1).toBe(orgId2);
      expect(method1).toBe(method2);
    });
  });
});
