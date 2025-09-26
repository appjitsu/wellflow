import { SetCurativeItemDueDateCommand } from './set-curative-item-due-date.command';

describe('SetCurativeItemDueDateCommand', () => {
  const validId = 'item-123';
  const validOrganizationId = 'org-456';
  const validDueDate = new Date('2024-06-15');
  const validUpdatedBy = 'user-789';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.dueDate).toBeUndefined();
      expect(command.updatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        validDueDate,
        validUpdatedBy,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.dueDate).toBe(validDueDate);
      expect(command.updatedBy).toBe(validUpdatedBy);
    });

    it('should create a command with dueDate only', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        validDueDate,
      );

      expect(command.dueDate).toBe(validDueDate);
      expect(command.updatedBy).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        validDueDate,
      );

      expect(command.id).toBeDefined();
      expect(command.organizationId).toBeDefined();
      expect(command.dueDate).toBeDefined();
    });

    it('should maintain date reference for dueDate', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        validDueDate,
      );

      expect(command.dueDate).toBe(validDueDate);
    });
  });

  describe('edge cases', () => {
    it('should handle null dueDate', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        null as any, // TypeScript would complain, but testing runtime
      );

      expect(command.dueDate).toBeNull();
    });

    it('should handle undefined dueDate', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        undefined,
      );

      expect(command.dueDate).toBeUndefined();
    });

    it('should handle empty string for updatedBy', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        validDueDate,
        '',
      );

      expect(command.updatedBy).toBe('');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new SetCurativeItemDueDateCommand(
        validId,
        validOrganizationId,
        validDueDate,
      );

      const id1 = command.id;
      const id2 = command.id;
      const dueDate1 = command.dueDate;
      const dueDate2 = command.dueDate;

      expect(id1).toBe(id2);
      expect(dueDate1).toBe(dueDate2);
    });
  });
});
