import { ApproveCashCallCommand } from '../approve-cash-call.command';

describe('ApproveCashCallCommand', () => {
  const validOrganizationId = 'org-123';
  const validId = 'cash-call-456';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new ApproveCashCallCommand(validOrganizationId, validId);

      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.id).toBe(validId);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new ApproveCashCallCommand(validOrganizationId, validId);

      expect(command.organizationId).toBeDefined();
      expect(command.id).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new ApproveCashCallCommand(validOrganizationId, validId);

      const orgId1 = command.organizationId;
      const orgId2 = command.organizationId;

      expect(orgId1).toBe(orgId2);
    });
  });
});
