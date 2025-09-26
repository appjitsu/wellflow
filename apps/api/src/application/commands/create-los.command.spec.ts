import { CreateLosCommand } from './create-los.command';

describe('CreateLosCommand', () => {
  const validOrganizationId = 'org-123';
  const validLeaseId = 'lease-456';
  const validYear = 2024;
  const validMonth = 3;
  const validNotes = 'Monthly operating statement for March 2024';
  const validCreatedBy = 'user-789';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        validMonth,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.year).toBe(validYear);
      expect(command.month).toBe(validMonth);
      expect(command.notes).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        validMonth,
        validNotes,
        validCreatedBy,
      );

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.leaseId).toBe(validLeaseId);
      expect(command.year).toBe(validYear);
      expect(command.month).toBe(validMonth);
      expect(command.notes).toBe(validNotes);
      expect(command.createdBy).toBe(validCreatedBy);
    });

    it('should create a command with notes only', () => {
      const command = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        validMonth,
        validNotes,
      );

      expect(command.notes).toBe(validNotes);
      expect(command.createdBy).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        validMonth,
        validNotes,
      );

      expect(command.organizationId).toBeDefined();
      expect(command.leaseId).toBeDefined();
      expect(command.year).toBeDefined();
      expect(command.month).toBeDefined();
      expect(command.notes).toBeDefined();
    });
  });

  describe('month and year validation', () => {
    it('should accept valid month values', () => {
      for (let month = 1; month <= 12; month++) {
        const command = new CreateLosCommand(
          validOrganizationId,
          validLeaseId,
          validYear,
          month,
        );

        expect(command.month).toBe(month);
      }
    });

    it('should accept valid year values', () => {
      const years = [2020, 2023, 2024, 2025, 2030];
      years.forEach((year) => {
        const command = new CreateLosCommand(
          validOrganizationId,
          validLeaseId,
          year,
          validMonth,
        );

        expect(command.year).toBe(year);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        validMonth,
        '',
        '',
      );

      expect(command.notes).toBe('');
      expect(command.createdBy).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        validMonth,
        undefined,
        undefined,
      );

      expect(command.notes).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });

    it('should handle month 1 and 12', () => {
      const commandJan = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        1,
      );

      const commandDec = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        12,
      );

      expect(commandJan.month).toBe(1);
      expect(commandDec.month).toBe(12);
    });

    it('should handle year 1900 and 2100', () => {
      const command1900 = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        1900,
        validMonth,
      );

      const command2100 = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        2100,
        validMonth,
      );

      expect(command1900.year).toBe(1900);
      expect(command2100.year).toBe(2100);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateLosCommand(
        validOrganizationId,
        validLeaseId,
        validYear,
        validMonth,
      );

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;
      const year1 = command.year;
      const year2 = command.year;

      expect(orgId1).toBe(orgId2);
      expect(year1).toBe(year2);
    });
  });
});
