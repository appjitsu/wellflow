import { RejectAfeCommand } from '../reject-afe.command';

describe('RejectAfeCommand', () => {
  const validAfeId = 'afe-123';
  const validRejectedBy = 'user-456';
  const validReason = 'Insufficient budget';

  describe('constructor', () => {
    it('should create a command with required properties', () => {
      const command = new RejectAfeCommand(validAfeId, validRejectedBy);

      expect(command.afeId).toBe(validAfeId);
      expect(command.rejectedBy).toBe(validRejectedBy);
      expect(command.reason).toBeUndefined();
    });

    it('should create a command with reason', () => {
      const command = new RejectAfeCommand(
        validAfeId,
        validRejectedBy,
        validReason,
      );

      expect(command.reason).toBe(validReason);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new RejectAfeCommand(validAfeId, validRejectedBy);

      expect(command.afeId).toBeDefined();
      expect(command.rejectedBy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty reason', () => {
      const command = new RejectAfeCommand(validAfeId, validRejectedBy, '');

      expect(command.reason).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new RejectAfeCommand(validAfeId, validRejectedBy);

      const afeId1 = command.afeId;
      const afeId2 = command.afeId;
      const rejectedBy1 = command.rejectedBy;
      const rejectedBy2 = command.rejectedBy;

      expect(afeId1).toBe(afeId2);
      expect(rejectedBy1).toBe(rejectedBy2);
    });
  });
});
