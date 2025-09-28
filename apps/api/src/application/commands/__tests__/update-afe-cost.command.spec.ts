import { UpdateAfeCostCommand } from '../update-afe-cost.command';

describe('UpdateAfeCostCommand', () => {
  const validAfeId = 'afe-123';
  const validEstimatedCost = 150000;
  const validActualCost = 145000;
  const validUpdatedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with required property', () => {
      const command = new UpdateAfeCostCommand(validAfeId);

      expect(command.afeId).toBe(validAfeId);
      expect(command.estimatedCost).toBeUndefined();
      expect(command.actualCost).toBeUndefined();
      expect(command.updatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdateAfeCostCommand(
        validAfeId,
        validEstimatedCost,
        validActualCost,
        validUpdatedBy,
      );

      expect(command.estimatedCost).toBe(validEstimatedCost);
      expect(command.actualCost).toBe(validActualCost);
      expect(command.updatedBy).toBe(validUpdatedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateAfeCostCommand(validAfeId);

      expect(command.afeId).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero costs', () => {
      const command = new UpdateAfeCostCommand(validAfeId, 0, 0);

      expect(command.estimatedCost).toBe(0);
      expect(command.actualCost).toBe(0);
    });

    it('should handle negative costs', () => {
      const command = new UpdateAfeCostCommand(validAfeId, -1000, -500);

      expect(command.estimatedCost).toBe(-1000);
      expect(command.actualCost).toBe(-500);
    });

    it('should handle empty updatedBy', () => {
      const command = new UpdateAfeCostCommand(
        validAfeId,
        validEstimatedCost,
        validActualCost,
        '',
      );

      expect(command.updatedBy).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateAfeCostCommand(validAfeId);

      const afeId1 = command.afeId;
      const afeId2 = command.afeId;

      expect(afeId1).toBe(afeId2);
    });
  });
});
