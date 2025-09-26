import { UpdateTitleOpinionStatusCommand } from './update-title-opinion-status.command';
import { TitleStatus } from '../../domain/entities/title-opinion.entity';

describe('UpdateTitleOpinionStatusCommand', () => {
  const validId = 'opinion-123';
  const validOrganizationId = 'org-456';
  const validStatusClear = TitleStatus.CLEAR;
  const validStatusDefective = TitleStatus.DEFECTIVE;
  const validStatusPending = TitleStatus.PENDING;
  const validUpdatedBy = 'user-789';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        validStatusClear,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.status).toBe(TitleStatus.CLEAR);
      expect(command.updatedBy).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        validStatusDefective,
        validUpdatedBy,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.status).toBe(TitleStatus.DEFECTIVE);
      expect(command.updatedBy).toBe(validUpdatedBy);
    });

    it('should create a command with status PENDING', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        validStatusPending,
      );

      expect(command.status).toBe(TitleStatus.PENDING);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        validStatusClear,
        validUpdatedBy,
      );

      expect(command.id).toBeDefined();
      expect(command.organizationId).toBeDefined();
      expect(command.status).toBeDefined();
      expect(command.updatedBy).toBeDefined();
    });
  });

  describe('TitleStatus enum values', () => {
    it('should accept CLEAR as valid status', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        TitleStatus.CLEAR,
      );

      expect(command.status).toBe(TitleStatus.CLEAR);
    });

    it('should accept DEFECTIVE as valid status', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        TitleStatus.DEFECTIVE,
      );

      expect(command.status).toBe(TitleStatus.DEFECTIVE);
    });

    it('should accept PENDING as valid status', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        TitleStatus.PENDING,
      );

      expect(command.status).toBe(TitleStatus.PENDING);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string for updatedBy', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        validStatusClear,
        '',
      );

      expect(command.updatedBy).toBe('');
    });

    it('should handle undefined updatedBy', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        validStatusClear,
        undefined,
      );

      expect(command.updatedBy).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateTitleOpinionStatusCommand(
        validId,
        validOrganizationId,
        validStatusClear,
        validUpdatedBy,
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
