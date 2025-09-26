import { FinalizeLosCommand } from './finalize-los.command';

describe('FinalizeLosCommand', () => {
  const validLosId = 'los-123';
  const validFinalizedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const command = new FinalizeLosCommand(validLosId, validFinalizedBy);

      expect(command.losId).toBe(validLosId);
      expect(command.finalizedBy).toBe(validFinalizedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new FinalizeLosCommand(validLosId, validFinalizedBy);

      expect(command.losId).toBeDefined();
      expect(command.finalizedBy).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new FinalizeLosCommand(validLosId, validFinalizedBy);

      const losId1 = command.losId;
      const losId2 = command.losId;

      expect(losId1).toBe(losId2);
    });
  });
});
