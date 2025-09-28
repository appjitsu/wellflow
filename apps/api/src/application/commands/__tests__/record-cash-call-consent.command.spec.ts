import { RecordCashCallConsentCommand } from '../record-cash-call-consent.command';

describe('RecordCashCallConsentCommand', () => {
  const validOrganizationId = 'org-123';
  const validId = 'consent-456';
  const validStatusReceived = 'RECEIVED' as const;
  const validStatusWaived = 'WAIVED' as const;
  const validReceivedAt = '2024-03-15';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusReceived,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.id).toBe(validId);
      expect(command.status).toBe('RECEIVED');
      expect(command.receivedAt).toBeUndefined();
    });

    it('should create a command with status RECEIVED and receivedAt', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusReceived,
        validReceivedAt,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.id).toBe(validId);
      expect(command.status).toBe('RECEIVED');
      expect(command.receivedAt).toBe(validReceivedAt);
    });

    it('should create a command with status WAIVED and receivedAt null', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusWaived,
        null,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.id).toBe(validId);
      expect(command.status).toBe('WAIVED');
      expect(command.receivedAt).toBeNull();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusReceived,
        validReceivedAt,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.id).toBeDefined();
      expect(command.status).toBeDefined();
      expect(command.receivedAt).toBeDefined();
    });
  });

  describe('status values', () => {
    it('should accept RECEIVED as valid status', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        'RECEIVED',
      );

      expect(command.status).toBe('RECEIVED');
    });

    it('should accept WAIVED as valid status', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        'WAIVED',
      );

      expect(command.status).toBe('WAIVED');
    });
  });

  describe('edge cases', () => {
    it('should handle null receivedAt', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusReceived,
        null,
      );

      expect(command.receivedAt).toBeNull();
    });

    it('should handle undefined receivedAt', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusReceived,
        undefined,
      );

      expect(command.receivedAt).toBeUndefined();
    });

    it('should handle empty string for receivedAt', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusReceived,
        '',
      );

      expect(command.receivedAt).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new RecordCashCallConsentCommand(
        validOrganizationId,
        validId,
        validStatusReceived,
        validReceivedAt,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const status1 = command.status;
      const status2 = command.status;

      expect(orgId1).toBe(orgId2);
      expect(status1).toBe(status2);
    });
  });
});
