import { UpdateDivisionOrderCommand } from './update-division-order.command';

describe('UpdateDivisionOrderCommand', () => {
  const validDivisionOrderId = 'division-order-123';
  const validDecimalInterest = 0.75;
  const validEffectiveDate = new Date('2024-01-01');
  const validUpdatedBy = 'user-456';
  const validReason = 'Annual adjustment';

  describe('constructor', () => {
    it('should create a command with required properties', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        validDecimalInterest,
        validEffectiveDate,
        validUpdatedBy,
      );

      expect(command.divisionOrderId).toBe(validDivisionOrderId);
      expect(command.decimalInterest).toBe(validDecimalInterest);
      expect(command.effectiveDate).toBe(validEffectiveDate);
      expect(command.updatedBy).toBe(validUpdatedBy);
      expect(command.reason).toBeUndefined();
    });

    it('should create a command with reason', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        validDecimalInterest,
        validEffectiveDate,
        validUpdatedBy,
        validReason,
      );

      expect(command.reason).toBe(validReason);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        validDecimalInterest,
        validEffectiveDate,
        validUpdatedBy,
      );

      expect(command.divisionOrderId).toBeDefined();
      expect(command.decimalInterest).toBeDefined();
      expect(command.effectiveDate).toBeDefined();
      expect(command.updatedBy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero decimal interest', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        0,
        validEffectiveDate,
        validUpdatedBy,
      );

      expect(command.decimalInterest).toBe(0);
    });

    it('should handle negative decimal interest', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        -0.1,
        validEffectiveDate,
        validUpdatedBy,
      );

      expect(command.decimalInterest).toBe(-0.1);
    });

    it('should handle decimal interest greater than 1', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        1.5,
        validEffectiveDate,
        validUpdatedBy,
      );

      expect(command.decimalInterest).toBe(1.5);
    });

    it('should handle empty reason', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        validDecimalInterest,
        validEffectiveDate,
        validUpdatedBy,
        '',
      );

      expect(command.reason).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateDivisionOrderCommand(
        validDivisionOrderId,
        validDecimalInterest,
        validEffectiveDate,
        validUpdatedBy,
      );

      const divisionOrderId1 = command.divisionOrderId;
      const divisionOrderId2 = command.divisionOrderId;
      const decimalInterest1 = command.decimalInterest;
      const decimalInterest2 = command.decimalInterest;

      expect(divisionOrderId1).toBe(divisionOrderId2);
      expect(decimalInterest1).toBe(decimalInterest2);
    });
  });
});
