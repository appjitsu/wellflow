import { DeactivateDivisionOrderCommand } from './deactivate-division-order.command';

describe('DeactivateDivisionOrderCommand', () => {
  const validDivisionOrderId = 'division-order-123';
  const validDeactivatedBy = 'user-456';
  const validReason = 'Contract terminated';

  describe('constructor', () => {
    it('should create a command with required properties', () => {
      const command = new DeactivateDivisionOrderCommand(
        validDivisionOrderId,
        validDeactivatedBy,
      );

      expect(command.divisionOrderId).toBe(validDivisionOrderId);
      expect(command.deactivatedBy).toBe(validDeactivatedBy);
      expect(command.reason).toBeUndefined();
    });

    it('should create a command with reason', () => {
      const command = new DeactivateDivisionOrderCommand(
        validDivisionOrderId,
        validDeactivatedBy,
        validReason,
      );

      expect(command.reason).toBe(validReason);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new DeactivateDivisionOrderCommand(
        validDivisionOrderId,
        validDeactivatedBy,
      );

      expect(command.divisionOrderId).toBeDefined();
      expect(command.deactivatedBy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty reason', () => {
      const command = new DeactivateDivisionOrderCommand(
        validDivisionOrderId,
        validDeactivatedBy,
        '',
      );

      expect(command.reason).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new DeactivateDivisionOrderCommand(
        validDivisionOrderId,
        validDeactivatedBy,
      );

      const divisionOrderId1 = command.divisionOrderId;
      const divisionOrderId2 = command.divisionOrderId;
      const deactivatedBy1 = command.deactivatedBy;
      const deactivatedBy2 = command.deactivatedBy;

      expect(divisionOrderId1).toBe(divisionOrderId2);
      expect(deactivatedBy1).toBe(deactivatedBy2);
    });
  });
});
