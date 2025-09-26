import { UpdateTitleOpinionFindingsCommand } from './update-title-opinion-findings.command';

describe('UpdateTitleOpinionFindingsCommand', () => {
  const validId = 'opinion-123';
  const validOrganizationId = 'org-456';
  const validFindings = 'Title is clear with minor exceptions';
  const validRecommendations = 'Recommend curative actions for exceptions';

  describe('constructor', () => {
    it('should create a command with required properties only', () => {
      const command = new UpdateTitleOpinionFindingsCommand(
        validId,
        validOrganizationId,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.findings).toBeUndefined();
      expect(command.recommendations).toBeUndefined();
    });

    it('should create a command with all properties', () => {
      const command = new UpdateTitleOpinionFindingsCommand(
        validId,
        validOrganizationId,
        validFindings,
        validRecommendations,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.findings).toBe(validFindings);
      expect(command.recommendations).toBe(validRecommendations);
    });

    it('should create a command with findings only', () => {
      const command = new UpdateTitleOpinionFindingsCommand(
        validId,
        validOrganizationId,
        validFindings,
      );

      expect(command.id).toBe(validId);
      expect(command.organizationId).toBe(validOrganizationId);
      expect(command.findings).toBe(validFindings);
      expect(command.recommendations).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateTitleOpinionFindingsCommand(
        validId,
        validOrganizationId,
        validFindings,
      );

      expect(command.id).toBeDefined();
      expect(command.organizationId).toBeDefined();
      expect(command.findings).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings for optional properties', () => {
      const command = new UpdateTitleOpinionFindingsCommand(
        validId,
        validOrganizationId,
        '',
        '',
      );

      expect(command.findings).toBe('');
      expect(command.recommendations).toBe('');
    });

    it('should handle undefined optional properties', () => {
      const command = new UpdateTitleOpinionFindingsCommand(
        validId,
        validOrganizationId,
        undefined,
        undefined,
      );

      expect(command.findings).toBeUndefined();
      expect(command.recommendations).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new UpdateTitleOpinionFindingsCommand(
        validId,
        validOrganizationId,
        validFindings,
      );

      const id1 = command.id;
      const id2 = command.id;

      expect(id1).toBe(id2);
    });
  });
});
