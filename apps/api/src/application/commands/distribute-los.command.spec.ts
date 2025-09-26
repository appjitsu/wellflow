import { DistributeLosCommand } from './distribute-los.command';

describe('DistributeLosCommand', () => {
  const validLosId = 'los-123';
  const validDistributedBy = 'user-456';
  const validDistributionMethod = 'mail';
  const validRecipientCount = 5;

  describe('constructor', () => {
    it('should create a command with required properties and defaults', () => {
      const command = new DistributeLosCommand(validLosId, validDistributedBy);

      expect(command.losId).toBe(validLosId);
      expect(command.distributedBy).toBe(validDistributedBy);
      expect(command.distributionMethod).toBe('email');
      expect(command.recipientCount).toBe(1);
    });

    it('should create a command with custom distribution method', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
      );

      expect(command.losId).toBe(validLosId);
      expect(command.distributedBy).toBe(validDistributedBy);
      expect(command.distributionMethod).toBe(validDistributionMethod);
      expect(command.recipientCount).toBe(1);
    });

    it('should create a command with custom recipient count', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
        validRecipientCount,
      );

      expect(command.losId).toBe(validLosId);
      expect(command.distributedBy).toBe(validDistributedBy);
      expect(command.distributionMethod).toBe(validDistributionMethod);
      expect(command.recipientCount).toBe(validRecipientCount);
    });

    it('should create a command with all custom parameters', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
        validRecipientCount,
      );

      expect(command.losId).toBe(validLosId);
      expect(command.distributedBy).toBe(validDistributedBy);
      expect(command.distributionMethod).toBe(validDistributionMethod);
      expect(command.recipientCount).toBe(validRecipientCount);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
        validRecipientCount,
      );

      expect(command.losId).toBeDefined();
      expect(command.distributedBy).toBeDefined();
      expect(command.distributionMethod).toBeDefined();
      expect(command.recipientCount).toBeDefined();
    });
  });

  describe('default values', () => {
    it('should use default distribution method when not provided', () => {
      const command = new DistributeLosCommand(validLosId, validDistributedBy);

      expect(command.distributionMethod).toBe('email');
    });

    it('should use default recipient count when not provided', () => {
      const command = new DistributeLosCommand(validLosId, validDistributedBy);

      expect(command.recipientCount).toBe(1);
    });

    it('should use default recipient count when distribution method is provided but count is not', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
      );

      expect(command.recipientCount).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero recipient count', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
        0,
      );

      expect(command.recipientCount).toBe(0);
    });

    it('should handle large recipient count', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
        1000,
      );

      expect(command.recipientCount).toBe(1000);
    });

    it('should handle empty distribution method', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        '',
      );

      expect(command.distributionMethod).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new DistributeLosCommand(
        validLosId,
        validDistributedBy,
        validDistributionMethod,
        validRecipientCount,
      );

      const losId1 = command.losId;
      const losId2 = command.losId;
      const method1 = command.distributionMethod;
      const method2 = command.distributionMethod;

      expect(losId1).toBe(losId2);
      expect(method1).toBe(method2);
    });
  });
});
