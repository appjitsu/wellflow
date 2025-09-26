import {
  CashCall,
  CashCallStatus,
  CashCallType,
  CashCallConsentStatus,
  CashCallProps,
} from './cash-call.entity';

describe('CashCall', () => {
  describe('types and enums', () => {
    it('should define CashCallStatus values', () => {
      const statuses: CashCallStatus[] = [
        'DRAFT',
        'SENT',
        'APPROVED',
        'REJECTED',
        'PAID',
        'DEFAULTED',
      ];
      expect(statuses).toBeDefined();
    });

    it('should define CashCallType values', () => {
      const types: CashCallType[] = ['MONTHLY', 'SUPPLEMENTAL'];
      expect(types).toBeDefined();
    });

    it('should define CashCallConsentStatus values', () => {
      const consentStatuses: CashCallConsentStatus[] = [
        'NOT_REQUIRED',
        'REQUIRED',
        'RECEIVED',
        'WAIVED',
      ];
      expect(consentStatuses).toBeDefined();
    });
  });

  describe('constructor', () => {
    it('should create cash call with minimal required properties', () => {
      const props: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      const cashCall = new CashCall(props);

      expect(cashCall.getId()).toBeDefined();
      expect(cashCall.getOrganizationId()).toBe('org-123');
      expect(cashCall.getLeaseId()).toBe('lease-456');
      expect(cashCall.getPartnerId()).toBe('partner-789');
    });

    it('should create cash call with all properties', () => {
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-02T10:00:00Z');
      const consentReceivedAt = new Date('2024-01-03T10:00:00Z');
      const approvedAt = new Date('2024-01-04T10:00:00Z');

      const props: CashCallProps = {
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        dueDate: '2024-01-15',
        amount: '1500.50',
        type: 'SUPPLEMENTAL',
        status: 'APPROVED',
        interestRatePercent: '5.25',
        consentRequired: true,
        consentStatus: 'RECEIVED',
        consentReceivedAt,
        approvedAt,
        createdAt,
        updatedAt,
      };

      const cashCall = new CashCall(props);

      expect(cashCall.getId()).toBe('cash-call-123');
      expect(cashCall.getOrganizationId()).toBe('org-123');
      expect(cashCall.getLeaseId()).toBe('lease-456');
      expect(cashCall.getPartnerId()).toBe('partner-789');
    });

    it('should generate UUID if id not provided', () => {
      const props: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      const cashCall = new CashCall(props);
      expect(cashCall.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should set default consent status based on consentRequired', () => {
      const requiredProps: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: true,
      };

      const notRequiredProps: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      const requiredCashCall = new CashCall(requiredProps);
      const notRequiredCashCall = new CashCall(notRequiredProps);

      // Note: We can't directly test private consentStatus, but we can test via toPersistence
      const requiredPersistence = requiredCashCall.toPersistence();
      const notRequiredPersistence = notRequiredCashCall.toPersistence();

      expect(requiredPersistence.consentStatus).toBe('REQUIRED');
      expect(notRequiredPersistence.consentStatus).toBe('NOT_REQUIRED');
    });

    it('should set timestamps to current date if not provided', () => {
      const before = new Date();
      const props: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      const cashCall = new CashCall(props);
      const after = new Date();

      const persistence = cashCall.toPersistence();
      expect(persistence.createdAt).toBeInstanceOf(Date);
      expect(persistence.updatedAt).toBeInstanceOf(Date);
      expect(persistence.createdAt!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(persistence.createdAt!.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });
  });

  describe('validation', () => {
    it('should throw error for invalid billingMonth format', () => {
      const props: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024/01/01', // Invalid format
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      expect(() => new CashCall(props)).toThrow(
        'billingMonth must be YYYY-MM-DD',
      );
    });

    it('should throw error for invalid dueDate format', () => {
      const props: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        dueDate: '2024/01/15', // Invalid format
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      expect(() => new CashCall(props)).toThrow('dueDate must be YYYY-MM-DD');
    });

    it('should throw error for invalid amount format', () => {
      const props: CashCallProps = {
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '1000.0', // Invalid: only one decimal place
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      expect(() => new CashCall(props)).toThrow(
        'amount must be decimal string',
      );
    });

    it('should accept valid amount formats', () => {
      const validAmounts = ['1000.00', '0.01', '-500.50', '999999999999.99'];

      validAmounts.forEach((amount) => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount,
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: false,
        };

        expect(() => new CashCall(props)).not.toThrow();
      });
    });
  });

  describe('fromPersistence factory method', () => {
    it('should create cash call from persistence data', () => {
      const persistenceData: CashCallProps = {
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        dueDate: '2024-01-15',
        amount: '1500.50',
        type: 'SUPPLEMENTAL',
        status: 'APPROVED',
        interestRatePercent: '5.25',
        consentRequired: true,
        consentStatus: 'RECEIVED',
        consentReceivedAt: new Date('2024-01-03T10:00:00Z'),
        approvedAt: new Date('2024-01-04T10:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-04T10:00:00Z'),
      };

      const cashCall = CashCall.fromPersistence(persistenceData);

      expect(cashCall.getId()).toBe('cash-call-123');
      expect(cashCall.getOrganizationId()).toBe('org-123');
      expect(cashCall.getLeaseId()).toBe('lease-456');
      expect(cashCall.getPartnerId()).toBe('partner-789');

      const result = cashCall.toPersistence();
      expect(result).toEqual(persistenceData);
    });
  });

  describe('toPersistence', () => {
    it('should return correct persistence format', () => {
      const props: CashCallProps = {
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        dueDate: '2024-01-15',
        amount: '1500.50',
        type: 'SUPPLEMENTAL',
        status: 'APPROVED',
        interestRatePercent: '5.25',
        consentRequired: true,
        consentStatus: 'RECEIVED',
        consentReceivedAt: new Date('2024-01-03T10:00:00Z'),
        approvedAt: new Date('2024-01-04T10:00:00Z'),
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-04T10:00:00Z'),
      };

      const cashCall = new CashCall(props);
      const persistence = cashCall.toPersistence();

      expect(persistence).toEqual(props);
    });
  });

  describe('business logic methods', () => {
    describe('approve', () => {
      it('should approve cash call and set timestamps', () => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '1000.00',
          type: 'MONTHLY',
          status: 'SENT',
          consentRequired: false,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const cashCall = new CashCall(props);
        const beforeApprove = new Date();

        cashCall.approve();

        const afterApprove = new Date();
        const persistence = cashCall.toPersistence();

        expect(persistence.status).toBe('APPROVED');
        expect(persistence.approvedAt).toBeInstanceOf(Date);
        expect(persistence.approvedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeApprove.getTime(),
        );
        expect(persistence.approvedAt!.getTime()).toBeLessThanOrEqual(
          afterApprove.getTime(),
        );
        expect(persistence.updatedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeApprove.getTime(),
        );
      });
    });

    describe('markSent', () => {
      it('should mark cash call as sent and update timestamp', () => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '1000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: false,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const cashCall = new CashCall(props);
        const beforeMarkSent = new Date();

        cashCall.markSent();

        const afterMarkSent = new Date();
        const persistence = cashCall.toPersistence();

        expect(persistence.status).toBe('SENT');
        expect(persistence.updatedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeMarkSent.getTime(),
        );
        expect(persistence.updatedAt!.getTime()).toBeLessThanOrEqual(
          afterMarkSent.getTime(),
        );
      });
    });

    describe('markPaid', () => {
      it('should mark cash call as paid and update timestamp', () => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '1000.00',
          type: 'MONTHLY',
          status: 'APPROVED',
          consentRequired: false,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const cashCall = new CashCall(props);
        const beforeMarkPaid = new Date();

        cashCall.markPaid();

        const afterMarkPaid = new Date();
        const persistence = cashCall.toPersistence();

        expect(persistence.status).toBe('PAID');
        expect(persistence.updatedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeMarkPaid.getTime(),
        );
        expect(persistence.updatedAt!.getTime()).toBeLessThanOrEqual(
          afterMarkPaid.getTime(),
        );
      });
    });

    describe('recordConsent', () => {
      it('should record consent as RECEIVED with provided timestamp', () => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '1000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: true,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const cashCall = new CashCall(props);
        const consentReceivedAt = new Date('2024-01-05T10:00:00Z');
        const beforeRecord = new Date();

        cashCall.recordConsent('RECEIVED', consentReceivedAt);

        const afterRecord = new Date();
        const persistence = cashCall.toPersistence();

        expect(persistence.consentStatus).toBe('RECEIVED');
        expect(persistence.consentReceivedAt).toEqual(consentReceivedAt);
        expect(persistence.updatedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeRecord.getTime(),
        );
        expect(persistence.updatedAt!.getTime()).toBeLessThanOrEqual(
          afterRecord.getTime(),
        );
      });

      it('should record consent as RECEIVED with current timestamp when not provided', () => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '1000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: true,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const cashCall = new CashCall(props);
        const beforeRecord = new Date();

        cashCall.recordConsent('RECEIVED');

        const afterRecord = new Date();
        const persistence = cashCall.toPersistence();

        expect(persistence.consentStatus).toBe('RECEIVED');
        expect(persistence.consentReceivedAt).toBeInstanceOf(Date);
        expect(persistence.consentReceivedAt!.getTime()).toBeGreaterThanOrEqual(
          beforeRecord.getTime(),
        );
        expect(persistence.consentReceivedAt!.getTime()).toBeLessThanOrEqual(
          afterRecord.getTime(),
        );
      });

      it('should record consent as WAIVED and clear received timestamp', () => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '1000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: true,
          consentStatus: 'RECEIVED',
          consentReceivedAt: new Date('2024-01-05T10:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const cashCall = new CashCall(props);

        cashCall.recordConsent('WAIVED');

        const persistence = cashCall.toPersistence();

        expect(persistence.consentStatus).toBe('WAIVED');
        expect(persistence.consentReceivedAt).toBeNull();
      });

      it('should record consent as REQUIRED and clear received timestamp', () => {
        const props: CashCallProps = {
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '1000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: true,
          consentStatus: 'RECEIVED',
          consentReceivedAt: new Date('2024-01-05T10:00:00Z'),
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const cashCall = new CashCall(props);

        cashCall.recordConsent('REQUIRED');

        const persistence = cashCall.toPersistence();

        expect(persistence.consentStatus).toBe('REQUIRED');
        expect(persistence.consentReceivedAt).toBeNull();
      });
    });
  });

  describe('getters', () => {
    it('should return correct values', () => {
      const props: CashCallProps = {
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '1000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      };

      const cashCall = new CashCall(props);

      expect(cashCall.getId()).toBe('cash-call-123');
      expect(cashCall.getOrganizationId()).toBe('org-123');
      expect(cashCall.getLeaseId()).toBe('lease-456');
      expect(cashCall.getPartnerId()).toBe('partner-789');
    });
  });
});
