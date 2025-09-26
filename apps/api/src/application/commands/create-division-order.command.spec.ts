import { CreateDivisionOrderCommand } from './create-division-order.command';

describe('CreateDivisionOrderCommand', () => {
  const validOrganizationId = 'org-123';
  const validWellId = 'well-456';
  const validPartnerId = 'partner-789';
  const validDecimalInterest = 0.25;
  const validEffectiveDate = new Date('2024-01-01');
  const validEndDate = new Date('2024-12-31');
  const validCreatedBy = 'user-101';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.wellId).toBe(validWellId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.decimalInterest).toBe(validDecimalInterest);
      expect(command.effectiveDate).toBe(validEffectiveDate);
      expect(command.endDate).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
        validEndDate,
        validCreatedBy,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.wellId).toBe(validWellId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.decimalInterest).toBe(validDecimalInterest);
      expect(command.effectiveDate).toBe(validEffectiveDate);
      expect(command.endDate).toBe(validEndDate);
      expect(command.createdBy).toBe(validCreatedBy);
    });

    it('should create a command with endDate only', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
        validEndDate,
      );

      expect(command.endDate).toBe(validEndDate);
      expect(command.createdBy).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
        validEndDate,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.wellId).toBeDefined();
      expect(command.partnerId).toBeDefined();
      expect(command.decimalInterest).toBeDefined();
      expect(command.effectiveDate).toBeDefined();
      expect(command.endDate).toBeDefined();
    });

    it('should maintain date object references', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
        validEndDate,
      );

      expect(command.effectiveDate).toBe(validEffectiveDate);
      expect(command.endDate).toBe(validEndDate);
    });
  });

  describe('decimal interest validation', () => {
    it('should accept valid decimal interest values', () => {
      const interests = [0.0, 0.1, 0.25, 0.5, 0.75, 1.0];
      interests.forEach((interest) => {
        const command = new CreateDivisionOrderCommand(
          validOrganizationId,
          validWellId,
          validPartnerId,
          interest,
          validEffectiveDate,
        );

        expect(command.decimalInterest).toBe(interest);
      });
    });

    it('should accept fractional decimal interests', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        0.12345,
        validEffectiveDate,
      );

      expect(command.decimalInterest).toBe(0.12345);
    });
  });

  describe('edge cases', () => {
    it('should handle zero decimal interest', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        0.0,
        validEffectiveDate,
      );

      expect(command.decimalInterest).toBe(0.0);
    });

    it('should handle full decimal interest', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        1.0,
        validEffectiveDate,
      );

      expect(command.decimalInterest).toBe(1.0);
    });

    it('should handle undefined optional properties', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
        undefined,
        undefined,
      );

      expect(command.endDate).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });

    it('should handle empty string for createdBy', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
        validEndDate,
        '',
      );

      expect(command.createdBy).toBe('');
    });

    it('should handle same effective and end dates', () => {
      const sameDate = new Date('2024-06-01');
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        sameDate,
        sameDate,
      );

      expect(command.effectiveDate).toBe(sameDate);
      expect(command.endDate).toBe(sameDate);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateDivisionOrderCommand(
        validOrganizationId,
        validWellId,
        validPartnerId,
        validDecimalInterest,
        validEffectiveDate,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const interest1 = command.decimalInterest;
      const interest2 = command.decimalInterest;

      expect(orgId1).toBe(orgId2);
      expect(interest1).toBe(interest2);
    });
  });
});
