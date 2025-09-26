import { CreateAfeApprovalCommand } from './create-afe-approval.command';
import { AfeApprovalStatus } from '../../domain/enums/afe-status.enum';

describe('CreateAfeApprovalCommand', () => {
  const validAfeId = 'afe-123';
  const validPartnerId = 'partner-456';
  const validApprovalStatus = AfeApprovalStatus.PENDING;
  const validApprovedAmount = 150000;
  const validComments = 'Pending approval from partner';
  const validApprovedByUserId = 'user-789';

  describe('constructor', () => {
    it('should create a command with required properties', () => {
      const command = new CreateAfeApprovalCommand(
        validAfeId,
        validPartnerId,
        validApprovalStatus,
      );

      expect(command.afeId).toBe(validAfeId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.approvalStatus).toBe(validApprovalStatus);
      expect(command.approvedAmount).toBeUndefined();
      expect(command.comments).toBeUndefined();
      expect(command.approvedByUserId).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new CreateAfeApprovalCommand(
        validAfeId,
        validPartnerId,
        validApprovalStatus,
        validApprovedAmount,
        validComments,
        validApprovedByUserId,
      );

      expect(command.afeId).toBe(validAfeId);
      expect(command.partnerId).toBe(validPartnerId);
      expect(command.approvalStatus).toBe(validApprovalStatus);
      expect(command.approvedAmount).toBe(validApprovedAmount);
      expect(command.comments).toBe(validComments);
      expect(command.approvedByUserId).toBe(validApprovedByUserId);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateAfeApprovalCommand(
        validAfeId,
        validPartnerId,
        validApprovalStatus,
      );

      expect(command.afeId).toBeDefined();
      expect(command.partnerId).toBeDefined();
      expect(command.approvalStatus).toBeDefined();
    });
  });

  describe('AfeApprovalStatus enum', () => {
    it('should have correct approval status values', () => {
      expect(AfeApprovalStatus.PENDING).toBe('pending');
      expect(AfeApprovalStatus.APPROVED).toBe('approved');
      expect(AfeApprovalStatus.REJECTED).toBe('rejected');
      expect(AfeApprovalStatus.CONDITIONAL).toBe('conditional');
    });
  });

  describe('edge cases', () => {
    it('should handle zero approved amount', () => {
      const command = new CreateAfeApprovalCommand(
        validAfeId,
        validPartnerId,
        validApprovalStatus,
        0,
      );

      expect(command.approvedAmount).toBe(0);
    });

    it('should handle negative approved amount', () => {
      const command = new CreateAfeApprovalCommand(
        validAfeId,
        validPartnerId,
        validApprovalStatus,
        -1000,
      );

      expect(command.approvedAmount).toBe(-1000);
    });

    it('should handle empty optional strings', () => {
      const command = new CreateAfeApprovalCommand(
        validAfeId,
        validPartnerId,
        validApprovalStatus,
        validApprovedAmount,
        '',
        '',
      );

      expect(command.comments).toBe('');
      expect(command.approvedByUserId).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateAfeApprovalCommand(
        validAfeId,
        validPartnerId,
        validApprovalStatus,
      );

      const afeId1 = command.afeId;
      const afeId2 = command.afeId;
      const partnerId1 = command.partnerId;
      const partnerId2 = command.partnerId;

      expect(afeId1).toBe(afeId2);
      expect(partnerId1).toBe(partnerId2);
    });
  });
});
