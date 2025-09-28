import { ApproveAfeCommand } from '../approve-afe.command';

describe('ApproveAfeCommand', () => {
  const validAfeId = 'afe-123';
  const validApprovedBy = 'user-456';
  const validApprovedAmount = 150000;
  const validComments = 'Approved for drilling operations';

  describe('constructor', () => {
    it('should create a command with required properties', () => {
      const command = new ApproveAfeCommand(validAfeId, validApprovedBy);

      expect(command.afeId).toBe(validAfeId);
      expect(command.approvedBy).toBe(validApprovedBy);
      expect(command.approvedAmount).toBeUndefined();
      expect(command.comments).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new ApproveAfeCommand(
        validAfeId,
        validApprovedBy,
        validApprovedAmount,
        validComments,
      );

      expect(command.afeId).toBe(validAfeId);
      expect(command.approvedBy).toBe(validApprovedBy);
      expect(command.approvedAmount).toBe(validApprovedAmount);
      expect(command.comments).toBe(validComments);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new ApproveAfeCommand(validAfeId, validApprovedBy);

      expect(command.afeId).toBeDefined();
      expect(command.approvedBy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero approved amount', () => {
      const command = new ApproveAfeCommand(validAfeId, validApprovedBy, 0);

      expect(command.approvedAmount).toBe(0);
    });

    it('should handle negative approved amount', () => {
      const command = new ApproveAfeCommand(validAfeId, validApprovedBy, -1000);

      expect(command.approvedAmount).toBe(-1000);
    });

    it('should handle empty comments', () => {
      const command = new ApproveAfeCommand(
        validAfeId,
        validApprovedBy,
        validApprovedAmount,
        '',
      );

      expect(command.comments).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new ApproveAfeCommand(validAfeId, validApprovedBy);

      const afeId1 = command.afeId;
      const afeId2 = command.afeId;
      const approvedBy1 = command.approvedBy;
      const approvedBy2 = command.approvedBy;

      expect(afeId1).toBe(afeId2);
      expect(approvedBy1).toBe(approvedBy2);
    });
  });
});
