import { ActivateDivisionOrderCommand } from '../activate-division-order.command';

describe('ActivateDivisionOrderCommand', () => {
  const validDivisionOrderId = 'division-order-123';
  const validActivatedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new ActivateDivisionOrderCommand(
        validDivisionOrderId,
        validActivatedBy,
      );

      expect(command.divisionOrderId).toBe(validDivisionOrderId);
      expect(command.activatedBy).toBe(validActivatedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new ActivateDivisionOrderCommand(
        validDivisionOrderId,
        validActivatedBy,
      );

      expect(command.divisionOrderId).toBeDefined();
      expect(command.activatedBy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      const command = new ActivateDivisionOrderCommand('', '');

      expect(command.divisionOrderId).toBe('');
      expect(command.activatedBy).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new ActivateDivisionOrderCommand(
        validDivisionOrderId,
        validActivatedBy,
      );

      const divisionOrderId1 = command.divisionOrderId;
      const divisionOrderId2 = command.divisionOrderId;
      const activatedBy1 = command.activatedBy;
      const activatedBy2 = command.activatedBy;

      expect(divisionOrderId1).toBe(divisionOrderId2);
      expect(activatedBy1).toBe(activatedBy2);
    });
  });
});
