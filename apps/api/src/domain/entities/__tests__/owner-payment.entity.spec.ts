import {
  OwnerPayment,
  OwnerPaymentStatus,
  OwnerPaymentMethod,
  OwnerPaymentProps,
} from '../owner-payment.entity';

describe('OwnerPayment Entity', () => {
  const validProps: OwnerPaymentProps = {
    id: 'payment-123',
    organizationId: 'org-456',
    partnerId: 'partner-789',
    revenueDistributionId: 'rd-101',
    method: 'CHECK',
    status: 'PENDING',
    grossAmount: '1000.00',
    deductionsAmount: '50.00',
    taxWithheldAmount: '100.00',
    netAmount: '850.00',
    checkNumber: 'CHK-001',
    achTraceNumber: null,
    memo: 'Monthly royalty payment',
    paymentDate: new Date('2024-01-15'),
    clearedDate: null,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  };

  describe('Constructor', () => {
    it('should create owner payment with required fields', () => {
      const minimalProps: OwnerPaymentProps = {
        organizationId: 'org-456',
        partnerId: 'partner-789',
        revenueDistributionId: 'rd-101',
        method: 'CHECK',
        status: 'PENDING',
        grossAmount: '1000.00',
        netAmount: '1000.00',
      };

      const payment = new OwnerPayment(minimalProps);

      expect(payment.getId()).toBeDefined();
      expect(payment.getOrganizationId()).toBe('org-456');
      expect(payment.getPartnerId()).toBe('partner-789');
      expect(payment.getStatus()).toBe('PENDING');
    });

    it('should create owner payment with all optional fields', () => {
      const payment = new OwnerPayment(validProps);

      expect(payment.getId()).toBe('payment-123');
    });

    it('should generate UUID if id not provided', () => {
      const propsWithoutId = { ...validProps };
      delete propsWithoutId.id;

      const payment = new OwnerPayment(propsWithoutId);

      expect(payment.getId()).toBeDefined();
      expect(typeof payment.getId()).toBe('string');
      expect(payment.getId().length).toBeGreaterThan(0);
    });

    it('should set default values for optional fields', () => {
      const minimalProps: OwnerPaymentProps = {
        organizationId: 'org-456',
        partnerId: 'partner-789',
        revenueDistributionId: 'rd-101',
        method: 'ACH',
        status: 'PROCESSED',
        grossAmount: '500.00',
        netAmount: '500.00',
      };

      const payment = new OwnerPayment(minimalProps);

      // Test persistence to check default values
      const persistence = payment.toPersistence();
      expect(persistence.deductionsAmount).toBeNull();
      expect(persistence.taxWithheldAmount).toBeNull();
      expect(persistence.checkNumber).toBeNull();
      expect(persistence.achTraceNumber).toBeNull();
      expect(persistence.memo).toBeNull();
      expect(persistence.paymentDate).toBeNull();
      expect(persistence.clearedDate).toBeNull();
      expect(persistence.createdAt).toBeInstanceOf(Date);
      expect(persistence.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate required fields', () => {
      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            organizationId: '',
          }),
      ).toThrow('organizationId is required');

      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            partnerId: '',
          }),
      ).toThrow('partnerId is required');

      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            method: '' as OwnerPaymentMethod,
          }),
      ).toThrow('method is required');

      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            status: '' as OwnerPaymentStatus,
          }),
      ).toThrow('status is required');
    });

    it('should validate decimal format for amounts', () => {
      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            grossAmount: '1000',
          }),
      ).toThrow('grossAmount must be a decimal string with 2 digits');

      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            grossAmount: '1000.0',
          }),
      ).toThrow('grossAmount must be a decimal string with 2 digits');

      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            grossAmount: '1000.000',
          }),
      ).toThrow('grossAmount must be a decimal string with 2 digits');

      expect(
        () =>
          new OwnerPayment({
            ...validProps,
            netAmount: '850',
          }),
      ).toThrow('netAmount must be a decimal string with 2 digits');
    });

    it('should accept valid decimal formats', () => {
      const payment = new OwnerPayment({
        ...validProps,
        grossAmount: '1234.56',
        netAmount: '-123.45',
      });

      expect(payment.toPersistence().grossAmount).toBe('1234.56');
      expect(payment.toPersistence().netAmount).toBe('-123.45');
    });
  });

  describe('Getters', () => {
    let payment: OwnerPayment;

    beforeEach(() => {
      payment = new OwnerPayment(validProps);
    });

    it('should return correct id', () => {
      expect(payment.getId()).toBe('payment-123');
    });

    it('should return correct organizationId', () => {
      expect(payment.getOrganizationId()).toBe('org-456');
    });

    it('should return correct partnerId', () => {
      expect(payment.getPartnerId()).toBe('partner-789');
    });

    it('should return correct status', () => {
      expect(payment.getStatus()).toBe('PENDING');
    });
  });

  describe('Business Methods', () => {
    let payment: OwnerPayment;

    beforeEach(() => {
      payment = new OwnerPayment(validProps);
    });

    describe('markProcessed', () => {
      it('should mark payment as processed', () => {
        payment.markProcessed();

        expect(payment.getStatus()).toBe('PROCESSED');
      });

      it('should update updatedAt timestamp', () => {
        const beforeUpdate = payment.toPersistence().updatedAt!;
        payment.markProcessed();
        const afterUpdate = payment.toPersistence().updatedAt!;

        expect(afterUpdate.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime(),
        );
      });
    });

    describe('markCleared', () => {
      it('should mark payment as cleared with date', () => {
        const clearedDate = new Date('2024-01-20');

        payment.markCleared(clearedDate);

        expect(payment.getStatus()).toBe('CLEARED');
        expect(payment.toPersistence().clearedDate).toEqual(clearedDate);
      });

      it('should update updatedAt timestamp', () => {
        const beforeUpdate = payment.toPersistence().updatedAt!;
        payment.markCleared(new Date());
        const afterUpdate = payment.toPersistence().updatedAt!;

        expect(afterUpdate.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime(),
        );
      });
    });

    describe('voidPayment', () => {
      it('should void the payment', () => {
        payment.voidPayment();

        expect(payment.getStatus()).toBe('VOID');
      });

      it('should update updatedAt timestamp', () => {
        const beforeUpdate = payment.toPersistence().updatedAt!;
        payment.voidPayment();
        const afterUpdate = payment.toPersistence().updatedAt!;

        expect(afterUpdate.getTime()).toBeGreaterThanOrEqual(
          beforeUpdate.getTime(),
        );
      });
    });

    describe('Status Transitions', () => {
      it('should allow valid status transitions', () => {
        // PENDING -> PROCESSED
        payment.markProcessed();
        expect(payment.getStatus()).toBe('PROCESSED');

        // PROCESSED -> CLEARED
        payment.markCleared(new Date());
        expect(payment.getStatus()).toBe('CLEARED');

        // CLEARED -> VOID (if needed)
        payment.voidPayment();
        expect(payment.getStatus()).toBe('VOID');
      });
    });
  });

  describe('Factory Methods', () => {
    describe('fromPersistence', () => {
      it('should create owner payment from persistence data', () => {
        const persistenceData: OwnerPaymentProps = {
          id: 'payment-123',
          organizationId: 'org-456',
          partnerId: 'partner-789',
          revenueDistributionId: 'rd-101',
          method: 'WIRE',
          status: 'CLEARED',
          grossAmount: '2000.00',
          deductionsAmount: '100.00',
          taxWithheldAmount: '200.00',
          netAmount: '1700.00',
          checkNumber: null,
          achTraceNumber: 'ACH-12345',
          memo: 'Wire transfer payment',
          paymentDate: new Date('2024-01-15'),
          clearedDate: new Date('2024-01-16'),
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-16'),
        };

        const payment = OwnerPayment.fromPersistence(persistenceData);

        expect(payment.getId()).toBe('payment-123');
        expect(payment.getOrganizationId()).toBe('org-456');
        expect(payment.getPartnerId()).toBe('partner-789');
        expect(payment.getStatus()).toBe('CLEARED');
        expect(payment.toPersistence()).toEqual(persistenceData);
      });
    });
  });

  describe('Persistence Methods', () => {
    let payment: OwnerPayment;

    beforeEach(() => {
      payment = new OwnerPayment(validProps);
    });

    describe('toPersistence', () => {
      it('should convert to persistence format correctly', () => {
        const persistenceData = payment.toPersistence();

        expect(persistenceData.id).toBe('payment-123');
        expect(persistenceData.organizationId).toBe('org-456');
        expect(persistenceData.partnerId).toBe('partner-789');
        expect(persistenceData.revenueDistributionId).toBe('rd-101');
        expect(persistenceData.method).toBe('CHECK');
        expect(persistenceData.status).toBe('PENDING');
        expect(persistenceData.grossAmount).toBe('1000.00');
        expect(persistenceData.deductionsAmount).toBe('50.00');
        expect(persistenceData.taxWithheldAmount).toBe('100.00');
        expect(persistenceData.netAmount).toBe('850.00');
        expect(persistenceData.checkNumber).toBe('CHK-001');
        expect(persistenceData.achTraceNumber).toBeNull();
        expect(persistenceData.memo).toBe('Monthly royalty payment');
        expect(persistenceData.paymentDate).toEqual(new Date('2024-01-15'));
        expect(persistenceData.clearedDate).toBeNull();
        expect(persistenceData.createdAt).toEqual(new Date('2024-01-10'));
        expect(persistenceData.updatedAt).toEqual(new Date('2024-01-10'));
      });

      it('should handle null values in persistence', () => {
        const minimalProps: OwnerPaymentProps = {
          organizationId: 'org-456',
          partnerId: 'partner-789',
          revenueDistributionId: 'rd-101',
          method: 'ACH',
          status: 'PROCESSED',
          grossAmount: '500.00',
          netAmount: '500.00',
        };

        const minimalPayment = new OwnerPayment(minimalProps);
        const persistenceData = minimalPayment.toPersistence();

        expect(persistenceData.deductionsAmount).toBeNull();
        expect(persistenceData.taxWithheldAmount).toBeNull();
        expect(persistenceData.checkNumber).toBeNull();
        expect(persistenceData.achTraceNumber).toBeNull();
        expect(persistenceData.memo).toBeNull();
        expect(persistenceData.paymentDate).toBeNull();
        expect(persistenceData.clearedDate).toBeNull();
      });
    });
  });

  describe('Type Definitions', () => {
    it('should define OwnerPaymentStatus values', () => {
      const statuses: OwnerPaymentStatus[] = [
        'PENDING',
        'PROCESSED',
        'CLEARED',
        'VOID',
        'REVERSED',
        'FAILED',
      ];

      statuses.forEach((status) => {
        expect([
          'PENDING',
          'PROCESSED',
          'CLEARED',
          'VOID',
          'REVERSED',
          'FAILED',
        ]).toContain(status);
      });
    });

    it('should define OwnerPaymentMethod values', () => {
      const methods: OwnerPaymentMethod[] = ['CHECK', 'ACH', 'WIRE'];

      methods.forEach((method) => {
        expect(['CHECK', 'ACH', 'WIRE']).toContain(method);
      });
    });
  });
});
