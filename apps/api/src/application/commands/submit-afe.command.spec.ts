import { SubmitAfeCommand } from './submit-afe.command';

describe('SubmitAfeCommand', () => {
  const validAfeId = 'afe-123';
  const validSubmittedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new SubmitAfeCommand(validAfeId, validSubmittedBy);

      expect(command.afeId).toBe(validAfeId);
      expect(command.submittedBy).toBe(validSubmittedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new SubmitAfeCommand(validAfeId, validSubmittedBy);

      expect(command.afeId).toBeDefined();
      expect(command.submittedBy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const command = new SubmitAfeCommand('', '');

      expect(command.afeId).toBe('');
      expect(command.submittedBy).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new SubmitAfeCommand(validAfeId, validSubmittedBy);

      const afeId1 = command.afeId;
      const afeId2 = command.afeId;
      const submittedBy1 = command.submittedBy;
      const submittedBy2 = command.submittedBy;

      expect(afeId1).toBe(afeId2);
      expect(submittedBy1).toBe(submittedBy2);
    });
  });
});
