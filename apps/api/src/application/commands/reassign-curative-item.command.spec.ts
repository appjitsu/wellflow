import { ReassignCurativeItemCommand } from './reassign-curative-item.command';

describe('ReassignCurativeItemCommand', () => {
  const validId = 'item-123';
  const validOrganizationId = 'org-456';
  const validAssignedTo = 'user-789';
  const validUpdatedBy = 'user-101';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new ReassignCurativeItemCommand(
        validId,
        validOrganizationId,
        validAssignedTo,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.assignedTo).toBe(validAssignedTo);
      expect(command.updatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new ReassignCurativeItemCommand(
        validId,
        validOrganizationId,
        validAssignedTo,
        validUpdatedBy,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.assignedTo).toBe(validAssignedTo);
      expect(command.updatedBy).toBe(validUpdatedBy);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new ReassignCurativeItemCommand(
        validId,
        validOrganizationId,
        validAssignedTo,
        validUpdatedBy,
      );

      expect(command.id).toBeDefined();
      expect(command.organizationId).toBeDefined();
      expect(command.assignedTo).toBeDefined();
      expect(command.updatedBy).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string for updatedBy', () => {
      const command = new ReassignCurativeItemCommand(
        validId,
        validOrganizationId,
        validAssignedTo,
        '',
      );

      expect(command.updatedBy).toBe('');
    });

    it('should handle undefined updatedBy', () => {
      const command = new ReassignCurativeItemCommand(
        validId,
        validOrganizationId,
        validAssignedTo,
        undefined,
      );

      expect(command.updatedBy).toBeUndefined();
    });

    it('should handle same assignedTo and updatedBy', () => {
      const sameUser = 'user-999';
      const command = new ReassignCurativeItemCommand(
        validId,
        validOrganizationId,
        sameUser,
        sameUser,
      );

      expect(command.assignedTo).toBe(sameUser);
      expect(command.updatedBy).toBe(sameUser);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new ReassignCurativeItemCommand(
        validId,
        validOrganizationId,
        validAssignedTo,
        validUpdatedBy,
      );

      const id1 = command.id;
      const id2 = command.id;
      const assignedTo1 = command.assignedTo;
      const assignedTo2 = command.assignedTo;

      expect(id1).toBe(id2);
      expect(assignedTo1).toBe(assignedTo2);
    });
  });
});
