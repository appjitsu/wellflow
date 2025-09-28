import { DeleteWellCommand } from '../delete-well.command';

describe('DeleteWellCommand', () => {
  const validId = 'well-123';
  const validDeletedBy = 'user-456';

  describe('constructor', () => {
    it('should create a command with required property', () => {
      const command = new DeleteWellCommand(validId);

      expect(command.id).toBe(validId);
      expect(command.deletedBy).toBeUndefined();
    });

    it('should create a command with deletedBy', () => {
      const command = new DeleteWellCommand(validId, validDeletedBy);

      expect(command.deletedBy).toBe(validDeletedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new DeleteWellCommand(validId);

      expect(command.id).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty deletedBy', () => {
      const command = new DeleteWellCommand(validId, '');

      expect(command.deletedBy).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new DeleteWellCommand(validId);

      const id1 = command.id;
      const id2 = command.id;

      expect(id1).toBe(id2);
    });
  });
});
