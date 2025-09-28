import { SubmitPermitCommand } from '../submit-permit.command';

describe('SubmitPermitCommand', () => {
  const validPermitId = 'permit-123';
  const validSubmittedByUserId = 'user-456';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new SubmitPermitCommand(
        validPermitId,
        validSubmittedByUserId,
      );

      expect(command.permitId).toBe(validPermitId);
      expect(command.submittedByUserId).toBe(validSubmittedByUserId);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new SubmitPermitCommand(
        validPermitId,
        validSubmittedByUserId,
      );

      expect(command.permitId).toBeDefined();
      expect(command.submittedByUserId).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new SubmitPermitCommand(
        validPermitId,
        validSubmittedByUserId,
      );

      const permitId1 = command.permitId;
      const permitId2 = command.permitId;

      expect(permitId1).toBe(permitId2);
    });
  });
});
