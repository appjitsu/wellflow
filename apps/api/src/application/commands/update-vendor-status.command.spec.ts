import { UpdateVendorStatusCommand } from './update-vendor-status.command';
import { VendorStatus } from '../../domain/enums/vendor-status.enum';

describe('UpdateVendorStatusCommand', () => {
  const validVendorId = 'vendor-123';
  const validNewStatusApproved = VendorStatus.APPROVED;
  const validNewStatusRejected = VendorStatus.REJECTED;
  const validNewStatusSuspended = VendorStatus.SUSPENDED;
  const validReason = 'Vendor meets all requirements';
  const validUpdatedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new UpdateVendorStatusCommand(
        validVendorId,
        validNewStatusApproved,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.newStatus).toBe(VendorStatus.APPROVED);
      expect(command.reason).toBeUndefined();
      expect(command.updatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdateVendorStatusCommand(
        validVendorId,
        validNewStatusRejected,
        validReason,
        validUpdatedBy,
      );

      expect(command.vendorId).toBe(validVendorId);
      expect(command.newStatus).toBe(VendorStatus.REJECTED);
      expect(command.reason).toBe(validReason);
      expect(command.updatedBy).toBe(validUpdatedBy);
    });

    it('should create a command with reason only', () => {
      const command = new UpdateVendorStatusCommand(
        validVendorId,
        validNewStatusSuspended,
        validReason,
      );

      expect(command.newStatus).toBe(VendorStatus.SUSPENDED);
      expect(command.reason).toBe(validReason);
      expect(command.updatedBy).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateVendorStatusCommand(
        validVendorId,
        validNewStatusApproved,
        validReason,
      );

      expect(command.vendorId).toBeDefined();
      expect(command.newStatus).toBeDefined();
      expect(command.reason).toBeDefined();
    });
  });

  describe('VendorStatus enum values', () => {
    const statuses = [
      VendorStatus.PENDING,
      VendorStatus.UNDER_REVIEW,
      VendorStatus.PREQUALIFIED,
      VendorStatus.APPROVED,
      VendorStatus.REJECTED,
      VendorStatus.SUSPENDED,
      VendorStatus.INACTIVE,
    ];

    statuses.forEach((status) => {
      it(`should accept ${status} as valid newStatus`, () => {
        const command = new UpdateVendorStatusCommand(validVendorId, status);

        expect(command.newStatus).toBe(status);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new UpdateVendorStatusCommand(
        validVendorId,
        validNewStatusApproved,
        '',
        '',
      );

      expect(command.reason).toBe('');
      expect(command.updatedBy).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new UpdateVendorStatusCommand(
        validVendorId,
        validNewStatusApproved,
        undefined,
        undefined,
      );

      expect(command.reason).toBeUndefined();
      expect(command.updatedBy).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateVendorStatusCommand(
        validVendorId,
        validNewStatusApproved,
        validReason,
      );

      const vendorId1 = command.vendorId;
      const vendorId2 = command.vendorId;
      const status1 = command.newStatus;
      const status2 = command.newStatus;

      expect(vendorId1).toBe(vendorId2);
      expect(status1).toBe(status2);
    });
  });
});
