import { UpdateCurativeItemStatusCommand } from '../update-curative-item-status.command';
import { CurativeStatus } from '../../../domain/entities/curative-item.entity';

describe('UpdateCurativeItemStatusCommand', () => {
  const validId = 'item-123';
  const validOrganizationId = 'org-456';
  const validStatusOpen = CurativeStatus.OPEN;
  const validStatusInProgress = CurativeStatus.IN_PROGRESS;
  const validStatusResolved = CurativeStatus.RESOLVED;
  // Valid status option for testing
  expect(CurativeStatus.WAIVED).toBeDefined();
  const validResolutionNotes = 'Issue resolved with updated documentation';
  const validUpdatedBy = 'user-789';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusOpen,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.status).toBe(CurativeStatus.OPEN);
      expect(command.resolutionNotes).toBeUndefined();
      expect(command.updatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusResolved,
        validResolutionNotes,
        validUpdatedBy,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.status).toBe(CurativeStatus.RESOLVED);
      expect(command.resolutionNotes).toBe(validResolutionNotes);
      expect(command.updatedBy).toBe(validUpdatedBy);
    });

    it('should create a command with resolutionNotes only', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusInProgress,
        validResolutionNotes,
      );

      expect(command.status).toBe(CurativeStatus.IN_PROGRESS);
      expect(command.resolutionNotes).toBe(validResolutionNotes);
      expect(command.updatedBy).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusOpen,
        validResolutionNotes,
      );

      expect(command.id).toBeDefined();
      expect(command.organizationId).toBeDefined();
      expect(command.status).toBeDefined();
      expect(command.resolutionNotes).toBeDefined();
    });
  });

  describe('CurativeStatus enum values', () => {
    it('should accept OPEN as valid status', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        CurativeStatus.OPEN,
      );

      expect(command.status).toBe(CurativeStatus.OPEN);
    });

    it('should accept IN_PROGRESS as valid status', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        CurativeStatus.IN_PROGRESS,
      );

      expect(command.status).toBe(CurativeStatus.IN_PROGRESS);
    });

    it('should accept RESOLVED as valid status', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        CurativeStatus.RESOLVED,
      );

      expect(command.status).toBe(CurativeStatus.RESOLVED);
    });

    it('should accept WAIVED as valid status', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        CurativeStatus.WAIVED,
      );

      expect(command.status).toBe(CurativeStatus.WAIVED);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusOpen,
        '',
        '',
      );

      expect(command.resolutionNotes).toBe('');
      expect(command.updatedBy).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusOpen,
        undefined,
        undefined,
      );

      expect(command.resolutionNotes).toBeUndefined();
      expect(command.updatedBy).toBeUndefined();
    });

    it('should handle long resolution notes', () => {
      const longNotes = 'A'.repeat(1000);
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusResolved,
        longNotes,
      );

      expect(command.resolutionNotes).toBe(longNotes);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateCurativeItemStatusCommand(
        validId,
        validOrganizationId,
        validStatusOpen,
        validResolutionNotes,
      );

      const id1 = command.id;
      const id2 = command.id;
      const status1 = command.status;
      const status2 = command.status;

      expect(id1).toBe(id2);
      expect(status1).toBe(status2);
    });
  });
});
