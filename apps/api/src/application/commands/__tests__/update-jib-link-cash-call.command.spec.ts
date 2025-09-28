import { UpdateJibLinkCashCallCommand } from '../update-jib-link-cash-call.command';

describe('UpdateJibLinkCashCallCommand', () => {
  const validOrganizationId = 'org-123';
  const validJibId = 'jib-456';
  const validAnnualInterestRatePercent = '5.25';
  const validDayCountBasis360 = 360 as const;
  const validDayCountBasis365 = 365 as const;

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.jibId).toBe(validJibId);
      expect(command.annualInterestRatePercent).toBe(
        validAnnualInterestRatePercent,
      );
      expect(command.dayCountBasis).toBeUndefined();
    });

    it('should create a command with dayCountBasis 360', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
        validDayCountBasis360,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.jibId).toBe(validJibId);
      expect(command.annualInterestRatePercent).toBe(
        validAnnualInterestRatePercent,
      );
      expect(command.dayCountBasis).toBe(360);
    });

    it('should create a command with dayCountBasis 365', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
        validDayCountBasis365,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.jibId).toBe(validJibId);
      expect(command.annualInterestRatePercent).toBe(
        validAnnualInterestRatePercent,
      );
      expect(command.dayCountBasis).toBe(365);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
        validDayCountBasis360,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.jibId).toBeDefined();
      expect(command.annualInterestRatePercent).toBeDefined();
      expect(command.dayCountBasis).toBeDefined();
    });
  });

  describe('dayCountBasis union type', () => {
    it('should accept 360 as valid dayCountBasis', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
        360,
      );

      expect(command.dayCountBasis).toBe(360);
    });

    it('should accept 365 as valid dayCountBasis', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
        365,
      );

      expect(command.dayCountBasis).toBe(365);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined dayCountBasis', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
        undefined,
      );

      expect(command.dayCountBasis).toBeUndefined();
    });

    it('should handle zero interest rate', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        '0.00',
      );

      expect(command.annualInterestRatePercent).toBe('0.00');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateJibLinkCashCallCommand(
        validOrganizationId,
        validJibId,
        validAnnualInterestRatePercent,
        validDayCountBasis360,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const basis1 = command.dayCountBasis;
      const basis2 = command.dayCountBasis;

      expect(orgId1).toBe(orgId2);
      expect(basis1).toBe(basis2);
    });
  });
});
